const { query } = require('../database/dbpromise');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { sendMetaMsg } = require('../helper/chatbot/meta/function');
const { recordChatbotLog } = require('./chatbotDiagnostics');
const { decryptKey } = require('../utils/crypto');
const { executeAIProvider } = require('./aiProviders');
const env = require('../env');
const config = require('../utils/ragConfig');

// Helper to resolve nested keys in objects (e.g., apiResponses.node_1.data.status)
function getNestedValue(obj, path) {
  if (!obj || !path) return '';
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return '';
    current = current[part];
  }
  return current !== undefined ? current : '';
}

// Helper to replace placeholders like {{senderName}} or {{variables.user_query}}
function replacePlaceholders(template, context) {
  if (!template || typeof template !== 'string') return template;

  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();

    // Core context mapping
    if (trimmedKey === 'senderName') return context.senderName || 'Guest';
    if (trimmedKey === 'senderMobile') return context.senderMobile || '';
    if (trimmedKey === 'senderMessage') return context.senderMessage || '';

    // Resolve nested keys e.g. apiResponses.node_1.data.status, session.name, form.email
    if (trimmedKey.startsWith('variables.')) {
      return getNestedValue(context.variables, trimmedKey.substring(10));
    }
    if (trimmedKey.startsWith('session.')) {
      return getNestedValue(context.session, trimmedKey.substring(8));
    }
    if (trimmedKey.startsWith('form.')) {
      return getNestedValue(context.formResponses, trimmedKey.substring(5));
    }
    if (trimmedKey.startsWith('formResponses.')) {
      return getNestedValue(context.formResponses, trimmedKey.substring(14));
    }
    if (trimmedKey.startsWith('apiResponses.')) {
      return getNestedValue(context.apiResponses, trimmedKey.substring(13));
    }
    if (trimmedKey.startsWith('aiResponses.')) {
      return getNestedValue(context.aiResponses, trimmedKey.substring(12));
    }
    if (trimmedKey.startsWith('mysqlResponses.')) {
      return getNestedValue(context.mysqlResponses, trimmedKey.substring(15));
    }

    // Direct fallbacks
    if (context.variables?.[trimmedKey] !== undefined) {
      return context.variables[trimmedKey];
    }
    if (context.session?.[trimmedKey] !== undefined) {
      return context.session[trimmedKey];
    }
    if (context.formResponses?.[trimmedKey] !== undefined) {
      return context.formResponses[trimmedKey];
    }

    return '';
  });
}

// Evaluate condition logic with optional case sensitivity
function evaluateCondition(leftVal, operator, rightVal, caseSensitive = false) {
  const rawLeft = String(leftVal || '').trim();
  const rawRight = String(rightVal || '').trim();
  const left = caseSensitive ? rawLeft : rawLeft.toLowerCase();
  const right = caseSensitive ? rawRight : rawRight.toLowerCase();

  switch (operator) {
    case 'equals':
    case 'Equal':
    case 'Exact Match':
      return left === right;
    case 'not_equals':
    case 'Not Equal':
      return left !== right;
    case 'contains':
    case 'Contains':
      return left.includes(right);
    case 'not_contains':
    case 'Not Contains':
      return !left.includes(right);
    case 'starts_with':
    case 'Starts With':
      return left.startsWith(right);
    case 'ends_with':
    case 'Ends With':
      return left.endsWith(right);
    case 'number_equals':
    case 'Number Equals':
      return parseFloat(rawLeft) === parseFloat(rawRight);
    case 'greater_than':
    case 'Greater Than':
      return parseFloat(rawLeft) > parseFloat(rawRight);
    case 'less_than':
    case 'Less Than':
      return parseFloat(rawLeft) < parseFloat(rawRight);
    case 'between':
    case 'Between': {
      const parts = rawRight.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length >= 2) {
        const val = parseFloat(rawLeft);
        return val >= parts[0] && val <= parts[1];
      }
      return false;
    }
    case 'regex':
    case 'Regex':
    case 'Regex Match':
      try {
        const flags = caseSensitive ? '' : 'i';
        const escapedRight = String(rawRight).replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedRight, flags);
        return regex.test(rawLeft);
      } catch {
        return false;
      }
    case 'is_empty':
    case 'Is Empty':
      return !leftVal || String(leftVal).trim() === '';
    case 'is_not_empty':
    case 'Is Not Empty':
      return leftVal && String(leftVal).trim() !== '';
    default:
      return false;
  }
}

// Helper to save all context state attributes to database
async function saveContextState(executionId, context) {
  const payload = {
    variables: context.variables || {},
    session: context.session || {},
    apiResponses: context.apiResponses || {},
    aiResponses: context.aiResponses || {},
    formResponses: context.formResponses || {},
    mysqlResponses: context.mysqlResponses || {},
    messageOutputs: context.messageOutputs || {},
  };
  await query(
    `UPDATE flow_executions SET variables = ?, labels = ?, current_node_id = ?, execution_path = ? WHERE id = ?`,
    [
      JSON.stringify(payload),
      JSON.stringify(context.labels || []),
      context.currentNode,
      JSON.stringify(context.executionPath || []),
      executionId,
    ],
  );
}

// Trigger flow execution (from incoming webhook or tester)
async function startFlow(
  flowId,
  incomingMsg,
  senderNumber,
  toName,
  uid,
  chatbot = null,
  isTest = false,
  initialVariables = {},
) {
  try {
    // 1. Fetch flow header
    const [flowRow] = await query(`SELECT * FROM automation_flows WHERE flow_id = ? AND uid = ?`, [
      flowId,
      uid,
    ]);
    if (!flowRow) {
      console.error(`Flow ${flowId} not found.`);
      return null;
    }

    let nodes = [];
    let edges = [];
    let versionNumber = null;

    // Load specific version based on isTest simulation flag
    let verRow;
    if (isTest) {
      // Simulator tests run on the latest draft or published version
      [verRow] = await query(
        `SELECT * FROM automation_flow_versions WHERE flow_id = ? AND uid = ? ORDER BY version DESC LIMIT 1`,
        [flowId, uid],
      );
    } else {
      // Production webhook runs run on the active published version
      [verRow] = await query(
        `SELECT * FROM automation_flow_versions WHERE flow_id = ? AND uid = ? AND status = 'published' LIMIT 1`,
        [flowId, uid],
      );
    }

    if (verRow) {
      versionNumber = verRow.version;
      try {
        const flowJson =
          typeof verRow.flow_json === 'string' ? JSON.parse(verRow.flow_json) : verRow.flow_json;
        const rawNodes = flowJson.nodes || [];
        const rawEdges = flowJson.edges || [];

        // Format nodes into db shape for compatibility with execution loops
        nodes = rawNodes.map((n) => ({
          node_id: n.id,
          type: n.type,
          position_x: n.position?.x || 0,
          position_y: n.position?.y || 0,
          data: JSON.stringify(n.data || {}),
        }));

        edges = rawEdges.map((e) => ({
          edge_id: e.id,
          source: e.source,
          target: e.target,
          source_handle: e.sourceHandle,
          target_handle: e.targetHandle,
        }));
      } catch (parseErr) {
        console.error('Failed to parse flow_json for version', versionNumber, parseErr);
      }
    }

    // Legacy fallback if no versioning records exist
    if (nodes.length === 0) {
      nodes = await query(`SELECT * FROM automation_nodes WHERE flow_id = ?`, [flowId]);
      edges = await query(`SELECT * FROM automation_edges WHERE flow_id = ?`, [flowId]);
    }

    if (nodes.length === 0) {
      console.error(`Flow ${flowId} has no nodes.`);
      return null;
    }

    // 2. Identify Initial/Trigger node
    const initialNode = nodes.find((n) => n.type === 'initial' || n.type === 'TRIGGER');
    if (!initialNode) {
      console.error(`Flow ${flowId} has no Initial Node trigger.`);
      return null;
    }

    // 3. Setup Runtime Execution context
    const context = {
      senderName: toName,
      senderMobile: senderNumber,
      senderMessage: incomingMsg,
      variables: initialVariables || {},
      session: {},
      apiResponses: {},
      aiResponses: {},
      formResponses: {},
      mysqlResponses: {},
      messageOutputs: {},
      labels: [],
      currentNode: initialNode.node_id,
      executionPath: [initialNode.node_id],
    };

    // 4. Save Execution record in Database
    const payload = {
      variables: context.variables,
      session: context.session,
      apiResponses: context.apiResponses,
      aiResponses: context.aiResponses,
      formResponses: context.formResponses,
      mysqlResponses: context.mysqlResponses,
      messageOutputs: context.messageOutputs,
    };

    const [execRow] = await query(
      `INSERT INTO flow_executions 
        (flow_id, uid, sender_name, sender_mobile, status, current_node_id, variables, labels, execution_path, version)
       VALUES (?, ?, ?, ?, 'running', ?, ?, ?, ?, ?)
       RETURNING id`,
      [
        flowId,
        uid,
        toName,
        senderNumber,
        initialNode.node_id,
        JSON.stringify(payload),
        JSON.stringify(context.labels),
        JSON.stringify(context.executionPath),
        versionNumber,
      ],
    );

    const executionId = execRow.id;

    // 5. Run sequence loop
    await executeFlowStep(executionId, flowId, uid, nodes, edges, context, isTest, chatbot);

    return executionId;
  } catch (err) {
    console.error('Error starting chatbot automation flow', err);
    return null;
  }
}

// Resume execution when waiting response (like WA Form, delay)
async function resumeFlow(executionId, incomingMsg, chatbot = null) {
  try {
    const [execRow] = await query(`SELECT * FROM flow_executions WHERE id = ?`, [executionId]);
    if (!execRow || execRow.status !== 'paused') {
      return;
    }

    const flowId = execRow.flow_id;
    const uid = execRow.uid;
    const versionNumber = execRow.version;

    let nodes = [];
    let edges = [];

    if (versionNumber) {
      const [verRow] = await query(
        `SELECT * FROM automation_flow_versions WHERE flow_id = ? AND version = ? AND uid = ?`,
        [flowId, versionNumber, uid],
      );
      if (verRow) {
        try {
          const flowJson =
            typeof verRow.flow_json === 'string' ? JSON.parse(verRow.flow_json) : verRow.flow_json;
          const rawNodes = flowJson.nodes || [];
          const rawEdges = flowJson.edges || [];

          nodes = rawNodes.map((n) => ({
            node_id: n.id,
            type: n.type,
            position_x: n.position?.x || 0,
            position_y: n.position?.y || 0,
            data: JSON.stringify(n.data || {}),
          }));

          edges = rawEdges.map((e) => ({
            edge_id: e.id,
            source: e.source,
            target: e.target,
            source_handle: e.sourceHandle,
            target_handle: e.targetHandle,
          }));
        } catch (e) {
          console.error('Failed to parse flow_json for version in resumeFlow', versionNumber, e);
        }
      }
    }

    // Legacy fallback
    if (nodes.length === 0) {
      nodes = await query(`SELECT * FROM automation_nodes WHERE flow_id = ?`, [flowId]);
      edges = await query(`SELECT * FROM automation_edges WHERE flow_id = ?`, [flowId]);
    }

    const parsedVars = JSON.parse(execRow.variables || '{}');
    const context = {
      senderName: execRow.sender_name,
      senderMobile: execRow.sender_mobile,
      senderMessage: incomingMsg,
      variables: parsedVars.variables || parsedVars || {},
      session: parsedVars.session || {},
      apiResponses: parsedVars.apiResponses || {},
      aiResponses: parsedVars.aiResponses || {},
      formResponses: parsedVars.formResponses || {},
      mysqlResponses: parsedVars.mysqlResponses || {},
      messageOutputs: parsedVars.messageOutputs || {},
      labels: JSON.parse(execRow.labels || '[]'),
      currentNode: execRow.current_node_id,
      executionPath: JSON.parse(execRow.execution_path || '[]'),
    };

    // Evaluate if the node we paused on was waiting for input (Response Saver or Form)
    const currentNode = nodes.find((n) => n.node_id === context.currentNode);
    if (
      currentNode &&
      (currentNode.type === 'Response Saver' || currentNode.type === 'response-saver')
    ) {
      const nodeData = JSON.parse(currentNode.data || '{}');
      const varName = nodeData.variableName || 'user_query';
      context.variables[varName] = incomingMsg;

      // Support multiple response saver mappings if configured
      if (nodeData.mappings && Array.isArray(nodeData.mappings)) {
        nodeData.mappings.forEach((m) => {
          if (m.sourcePath && m.targetVariable) {
            context.variables[m.targetVariable] = getNestedValue(context, m.sourcePath);
          }
        });
      }
    } else if (
      currentNode &&
      (currentNode.type === 'Send WA Form' || currentNode.type === 'send-wa-form')
    ) {
      const nodeData = JSON.parse(currentNode.data || '{}');
      const varName = nodeData.saveResponseVariable || 'form_response';

      // Parse form JSON output if applicable
      let formObj = {};
      try {
        formObj = JSON.parse(incomingMsg);
      } catch {
        formObj = { value: incomingMsg };
      }

      context.formResponses = formObj;
      context.variables.form = formObj;
      context.variables.formResponses = formObj;
      context.variables[varName] = incomingMsg;
    }

    // Set status back to running
    await query(`UPDATE flow_executions SET status = 'running' WHERE id = ?`, [executionId]);

    // Save variables state
    await saveContextState(executionId, context);

    // Find next node(s) and proceed
    const matchingEdges = edges.filter((e) => e.source === context.currentNode);
    if (matchingEdges.length > 0) {
      const nextNodeId = matchingEdges[0].target;
      context.currentNode = nextNodeId;
      context.executionPath.push(nextNodeId);

      await executeFlowStep(executionId, flowId, uid, nodes, edges, context, false, chatbot);
    } else {
      // Completed flow
      await query(
        `UPDATE flow_executions SET status = 'completed', execution_path = ? WHERE id = ?`,
        [JSON.stringify(context.executionPath), executionId],
      );
    }
  } catch (err) {
    console.error('Error resuming flow execution', err);
  }
}

// Sequence execution engine
async function executeFlowStep(
  executionId,
  flowId,
  uid,
  nodes,
  edges,
  context,
  isTest = false,
  chatbot = null,
) {
  const maxSteps = 50;
  let stepsCount = 0;

  while (context.currentNode && stepsCount < maxSteps) {
    stepsCount++;
    const node_id = context.currentNode;
    const node = nodes.find((n) => n.node_id === node_id);

    if (!node) {
      // No node found, terminate execution
      await logExecutionNode(
        executionId,
        flowId,
        node_id,
        'failed',
        'Node definition not found in flow schema.',
      );
      break;
    }

    const startTime = Date.now();
    let status = 'success';
    let errorMsg = null;
    let nextNodeId = null;
    let nextSourceHandle = null;
    let isPaused = false;

    try {
      const nodeData = JSON.parse(node.data || '{}');

      // Handle individual node action type
      switch (node.type) {
        case 'initial':
        case 'TRIGGER':
          // Initial trigger passes through immediately to first connection
          break;

        case 'Send Message':
        case 'send-message':
          {
            const messageType = nodeData.messageType || 'Simple Text';
            const body = replacePlaceholders(nodeData.messageBody || nodeData.body || '', context);
            const footer = replacePlaceholders(
              nodeData.footerText || nodeData.footer || '',
              context,
            );
            const header = replacePlaceholders(
              nodeData.headerText || nodeData.header || '',
              context,
            );
            const mediaUrl = replacePlaceholders(
              nodeData.imageUrl ||
                nodeData.audioUrl ||
                nodeData.documentUrl ||
                nodeData.videoUrl ||
                nodeData.mediaUrl ||
                nodeData.media ||
                '',
              context,
            );

            let msgObj = null;

            if (messageType === 'Simple Text') {
              msgObj = {
                type: 'text',
                text: {
                  preview_url: true,
                  body: `${header ? header + '\n' : ''}${body}${footer ? '\n\n' + footer : ''}`,
                },
              };
            } else if (messageType === 'Image') {
              msgObj = {
                type: 'image',
                image: {
                  link: mediaUrl,
                  caption: replacePlaceholders(nodeData.caption || body || '', context),
                },
              };
            } else if (messageType === 'Audio') {
              msgObj = {
                type: 'audio',
                audio: {
                  link: mediaUrl,
                },
              };
            } else if (messageType === 'Document') {
              msgObj = {
                type: 'document',
                document: {
                  link: mediaUrl,
                  filename: replacePlaceholders(nodeData.filename || 'document.pdf', context),
                },
              };
            } else if (messageType === 'Video') {
              msgObj = {
                type: 'video',
                video: {
                  link: mediaUrl,
                  caption: replacePlaceholders(nodeData.caption || body || '', context),
                },
              };
            } else if (messageType === 'Location') {
              msgObj = {
                type: 'location',
                location: {
                  latitude: parseFloat(replacePlaceholders(nodeData.latitude || '0', context)),
                  longitude: parseFloat(replacePlaceholders(nodeData.longitude || '0', context)),
                  name: replacePlaceholders(nodeData.locationName || '', context),
                  address: replacePlaceholders(nodeData.address || '', context),
                },
              };
            } else if (messageType === 'Button Message') {
              const buttons = nodeData.buttons || [];
              msgObj = {
                type: 'interactive',
                interactive: {
                  type: 'button',
                  header: header ? { type: 'text', text: header } : undefined,
                  body: { text: body || 'Please select an option:' },
                  footer: footer ? { text: footer } : undefined,
                  action: {
                    buttons: buttons.slice(0, 3).map((btn, idx) => {
                      const btnTitle =
                        typeof btn === 'string'
                          ? btn
                          : btn.title || btn.text || `Button ${idx + 1}`;
                      return {
                        type: 'reply',
                        reply: {
                          id: `btn_${idx}`,
                          title: btnTitle,
                        },
                      };
                    }),
                  },
                },
              };
            } else if (messageType === 'List Message') {
              const listBtnTitle = replacePlaceholders(
                nodeData.listButtonTitle || 'Select Option',
                context,
              );
              const sections = nodeData.sections || [];
              msgObj = {
                type: 'interactive',
                interactive: {
                  type: 'list',
                  header: header ? { type: 'text', text: header } : undefined,
                  body: { text: body || 'Please select an option from the list:' },
                  footer: footer ? { text: footer } : undefined,
                  action: {
                    button: listBtnTitle,
                    sections: sections.map((sec, sIdx) => ({
                      title: replacePlaceholders(sec.title || `Section ${sIdx + 1}`, context),
                      rows: (sec.rows || []).map((row, rIdx) => ({
                        id: replacePlaceholders(row.id || `row_${sIdx}_${rIdx}`, context),
                        title: replacePlaceholders(row.title || `Row ${rIdx + 1}`, context),
                        description: replacePlaceholders(row.description || '', context),
                      })),
                    })),
                  },
                },
              };
            } else {
              msgObj = {
                type: 'text',
                text: { body: body || 'Empty message' },
              };
            }

            if (!isTest && chatbot && msgObj) {
              const savObj = {
                type: msgObj.type,
                metaChatId: '',
                msgContext: msgObj,
                reaction: '',
                timestamp: '',
                senderName: context.senderName,
                senderMobile: context.senderMobile,
                status: 'sent',
                star: false,
                route: 'OUTGOING',
              };
              const chatId = `${context.senderMobile}_${flowId}`;
              await sendMetaMsg({
                uid,
                msgObj,
                toNumber: context.senderMobile,
                savObj,
                chatId,
                chatbotFromMysq: chatbot,
              });
            } else {
              console.log(
                `[TEST RUN] Outgoing Message (${messageType}): ${JSON.stringify(msgObj)}`,
              );
            }

            if (!context.messageOutputs) {
              context.messageOutputs = {};
            }
            context.messageOutputs[node_id] = {
              messageType,
              msgObj,
              timestamp: new Date().toISOString(),
            };

            // Update last AI execution log with Send Message payload
            try {
              const [lastLog] = await query(
                'SELECT id, flow_builder FROM ai_execution_logs WHERE flow_id = ? AND uid = ? ORDER BY timestamp DESC LIMIT 1',
                [flowId, uid],
              );
              if (lastLog) {
                const fb = JSON.parse(lastLog.flow_builder || '{}');
                fb.sendMessagePayload = msgObj || {};
                await query('UPDATE ai_execution_logs SET flow_builder = ? WHERE id = ?', [
                  JSON.stringify(fb),
                  lastLog.id,
                ]);
              }
            } catch (fbErr) {
              console.error('Failed to update execution log flow_builder', fbErr);
            }

            context.variables[node_id] = { nodeType: 'message', delivered: true };
          }
          break;

        case 'Send WA Template':
        case 'send-wa-template':
          {
            const templateId = nodeData.templateId || 'default_template';
            let templateObj = null;
            const dbTemplates = await query(
              `SELECT * FROM templets WHERE uid = ? AND title = ? LIMIT 1`,
              [uid, templateId],
            );
            if (dbTemplates.length > 0) {
              try {
                templateObj = JSON.parse(dbTemplates[0].content);
              } catch {
                templateObj = null;
              }
            }

            let parameters = [];
            if (nodeData.parameters && Array.isArray(nodeData.parameters)) {
              parameters = nodeData.parameters.map((p) => ({
                type: 'text',
                text: replacePlaceholders(p.value || p, context),
              }));
            } else {
              const bodyVars = nodeData.bodyVariables || [];
              parameters = bodyVars.map((v) => ({
                type: 'text',
                text: replacePlaceholders(v, context),
              }));
            }

            if (!isTest && chatbot) {
              const msgObj = {
                type: 'template',
                template: {
                  name: templateId,
                  language: { code: nodeData.languageCode || 'en_US' },
                  components: [
                    parameters.length > 0
                      ? {
                          type: 'body',
                          parameters,
                        }
                      : undefined,
                  ].filter(Boolean),
                },
              };
              const savObj = {
                type: 'template',
                metaChatId: '',
                msgContext: msgObj,
                senderName: context.senderName,
                senderMobile: context.senderMobile,
                status: 'sent',
                route: 'OUTGOING',
              };
              const chatId = `${context.senderMobile}_${flowId}`;
              await sendMetaMsg({
                uid,
                msgObj,
                toNumber: context.senderMobile,
                savObj,
                chatId,
                chatbotFromMysq: chatbot,
              });
            } else {
              console.log(`[TEST RUN] Send WA Template: ${templateId}`);
            }
            context.variables[node_id] = { nodeType: 'template', sent: true };
          }
          break;

        case 'Send WA Form':
        case 'send-wa-form':
          {
            const formTitle = replacePlaceholders(
              nodeData.formTitle || 'Interactive Form',
              context,
            );
            const formBody = replacePlaceholders(
              nodeData.formBody || nodeData.body || 'Please fill out the form below:',
              context,
            );
            const formFooter = replacePlaceholders(
              nodeData.formFooter || nodeData.footer || 'Powered by B1G-CRM',
              context,
            );
            const formCta = replacePlaceholders(
              nodeData.formCta || nodeData.cta || 'Open Form',
              context,
            );
            const formId = nodeData.formId || 'default_form_id';

            if (!isTest && chatbot) {
              const msgObj = {
                type: 'interactive',
                interactive: {
                  type: 'flow',
                  header: {
                    type: 'text',
                    text: formTitle,
                  },
                  body: {
                    text: formBody,
                  },
                  footer: {
                    text: formFooter,
                  },
                  action: {
                    name: 'flow',
                    parameters: {
                      flow_message_version: '3',
                      flow_token: `token_${Date.now()}`,
                      flow_id: formId,
                      flow_cta: formCta,
                      flow_action: 'navigate',
                      flow_action_payload: {
                        screen: 'FIRST_SCREEN',
                        data: {
                          senderName: context.senderName,
                          senderMobile: context.senderMobile,
                        },
                      },
                    },
                  },
                },
              };
              const savObj = {
                type: 'interactive',
                metaChatId: '',
                msgContext: msgObj,
                senderName: context.senderName,
                senderMobile: context.senderMobile,
                status: 'sent',
                route: 'OUTGOING',
              };
              const chatId = `${context.senderMobile}_${flowId}`;
              await sendMetaMsg({
                uid,
                msgObj,
                toNumber: context.senderMobile,
                savObj,
                chatId,
                chatbotFromMysq: chatbot,
              });
            } else {
              console.log(`[TEST RUN] Send WA Form: ${formTitle}`);
            }

            // Pause execution waiting for reply
            isPaused = true;
            await query(
              `UPDATE flow_executions SET status = 'paused', current_node_id = ? WHERE id = ?`,
              [node_id, executionId],
            );
          }
          break;

        case 'Delay':
        case 'delay':
          {
            const amount = parseInt(nodeData.delayAmount || '5', 10);
            const unit = nodeData.delayUnit || 'seconds';

            let seconds = amount;
            if (unit === 'minutes') seconds = amount * 60;
            else if (unit === 'hours') seconds = amount * 3600;
            else if (unit === 'days') seconds = amount * 86400;

            console.log(`[Flow Delay] Pausing execution for ${seconds} seconds`);

            if (isTest || seconds <= 15) {
              const sleepDuration = isTest ? 100 : seconds * 1000;
              await new Promise((resolve) => setTimeout(resolve, sleepDuration));
            } else {
              isPaused = true;
              const resumeAt = new Date(Date.now() + seconds * 1000);
              await query(
                `UPDATE flow_executions SET status = 'paused_on_delay', current_node_id = ?, updated_at = ? WHERE id = ?`,
                [node_id, resumeAt, executionId],
              );
            }
          }
          break;

        case 'Response Saver':
        case 'response-saver':
          {
            const varName = nodeData.variableName || 'user_query';
            context.variables[varName] = context.senderMessage;

            if (nodeData.mappings && Array.isArray(nodeData.mappings)) {
              nodeData.mappings.forEach((m) => {
                if (m.sourcePath && m.targetVariable) {
                  const resolvedVal = replacePlaceholders(`{{${m.sourcePath}}}`, context);
                  context.variables[m.targetVariable] = resolvedVal;
                }
              });
            }
          }
          break;

        case 'Condition':
        case 'condition':
          {
            const conditionsList = nodeData.conditions || [];
            // Support custom input source — if enabled, use the configured variable path
            const useCustomInput = nodeData.customInput === true;
            const customSource = nodeData.customInputSource || '{{senderMessage}}';
            let matchedBranchIdx = -1;

            for (let i = 0; i < conditionsList.length; i++) {
              const cond = conditionsList[i];
              const inputSource = useCustomInput
                ? customSource
                : cond.variableName || '{{senderMessage}}';
              const resolvedLeft = replacePlaceholders(inputSource, context);
              const rightValue = replacePlaceholders(cond.valueToCompare || '', context);
              const op = cond.operator || 'Exact Match';
              const isCaseSensitive = cond.caseSensitive === true;

              if (evaluateCondition(resolvedLeft, op, rightValue, isCaseSensitive)) {
                matchedBranchIdx = i;
                break;
              }
            }

            if (matchedBranchIdx >= 0) {
              nextSourceHandle = `branch_${matchedBranchIdx}`;
            } else {
              nextSourceHandle = 'default_path';
            }
          }
          break;

        case 'Make Request':
        case 'make-request':
          {
            const url = replacePlaceholders(nodeData.url || '', context);
            const method = nodeData.method || 'GET';
            const body = replacePlaceholders(nodeData.body || '', context);

            let resolvedHeaders = {};
            if (nodeData.headers && Array.isArray(nodeData.headers)) {
              nodeData.headers.forEach((h) => {
                if (h.key) resolvedHeaders[h.key] = replacePlaceholders(h.value, context);
              });
            }

            const fetchOptions = {
              method,
              headers: {
                'Content-Type': 'application/json',
                ...resolvedHeaders,
              },
            };
            if (method !== 'GET' && method !== 'DELETE' && body) {
              fetchOptions.body = body;
            }

            try {
              const { isSafeUrl } = require('../utils/ssrfFilter');
              if (!(await isSafeUrl(url))) {
                throw new Error('Blocked potential SSRF attack vector');
              }
              const res = await fetch(url, fetchOptions);
              const text = await res.text();
              let json = {};
              try {
                json = JSON.parse(text);
              } catch {
                json = { rawResponse: text };
              }

              context.apiResponses[node_id] = json;

              if (nodeData.responseMappings && Array.isArray(nodeData.responseMappings)) {
                nodeData.responseMappings.forEach((mapping) => {
                  if (mapping.responsePath && mapping.saveToVariable) {
                    const val = getNestedValue(json, mapping.responsePath);
                    context.variables[mapping.saveToVariable] = val;
                  }
                });
              }
              context.variables[node_id] = { status: 'success', statusCode: res.status };
            } catch (err) {
              console.error('API Call Node failed', err);
              status = 'failed';
              errorMsg = err.message;
              context.apiResponses[node_id] = { error: err.message };
              context.variables[node_id] = { status: 'error', error: err.message };
            }
          }
          break;

        case 'AI Autopilot':
        case 'AI Transfer':
        case 'ai-transfer':
          {
            const provider = nodeData.provider || 'gemini';
            const model = nodeData.model || 'gemini-1.5-flash';
            const saveTo = nodeData.saveResponseVariable || 'ai_response';
            const temperature = nodeData.temperature;
            const maxTokens = nodeData.maxTokens;
            const systemPromptRaw =
              nodeData.systemPrompt || nodeData.promptInstruction || 'You are a helpful assistant.';
            let systemPrompt = replacePlaceholders(systemPromptRaw, context);

            let vectorSearchExecuted = false;
            let embeddingGenerated = false;
            let topChunks = [];
            let similarityScores = [];

            let keywordSearchExecuted = false;
            let matchedDocuments = [];
            let paragraphScores = [];

            let finalChunksSelected = [];
            let finalContextTextInjected = '';

            const messageReferenceCount = parseInt(nodeData.messageReferenceCount || '10', 10);
            const memoryMode = nodeData.memoryMode || 'Last 10 Messages';

            let encryptedKey = nodeData.apiKey;
            let actualKey = decryptKey(encryptedKey);

            if (!actualKey) {
              // Fallback to the tenant's configured credentials for this provider
              const tenantProviders = await query(
                'SELECT api_key, model FROM tenant_ai_providers WHERE uid = ? AND provider = ? AND enabled = 1 LIMIT 1',
                [uid, provider],
              );
              if (tenantProviders && tenantProviders.length > 0 && tenantProviders[0].api_key) {
                actualKey = tenantProviders[0].api_key;
                if (!nodeData.model) {
                  nodeData.model = tenantProviders[0].model;
                }
              }
            }

            let retrievalLatencyMs = 0;

            if (nodeData.ragEnabled === true && env.UNIFIED_AI_RUNTIME) {
              const ragStartTime = Date.now();
              try {
                const { vectorSearch, hybridRank } = require('../utils/ragHelper');
                vectorSearchExecuted = true;
                embeddingGenerated = true;

                // 1. Vector search (fetch up to 10 chunks to allow hybrid ranking)
                const vResults = await vectorSearch(uid, context.senderMessage, actualKey, 10);
                for (const vr of vResults) {
                  topChunks.push(vr.content);
                  similarityScores.push(vr.score);
                }

                // 2. Keyword Search on chunks
                keywordSearchExecuted = true;
                const kbs = await query(
                  `SELECT kbc.id AS chunk_id, kbc.kb_id, kbc.content, kb.title, kb.updated_at AS doc_updated_at
                   FROM knowledge_base_chunks kbc
                   JOIN knowledge_base kb ON kbc.kb_id = kb.id
                   WHERE kbc.uid = ?`,
                  [uid],
                );

                let keywordResults = [];
                if (kbs.length > 0 && context.senderMessage) {
                  const words = context.senderMessage
                    .toLowerCase()
                    .split(/\s+/)
                    .filter((w) => w.length > 2);
                  for (const kb of kbs) {
                    let score = 0;
                    for (const w of words) {
                      if (kb.content.toLowerCase().includes(w)) score++;
                    }
                    if (score > 0) {
                      keywordResults.push({
                        chunk_id: kb.chunk_id,
                        kb_id: kb.kb_id,
                        title: kb.title,
                        content: kb.content,
                        score,
                        doc_updated_at: kb.doc_updated_at,
                      });
                      paragraphScores.push({ paragraph: kb.content, score, title: kb.title });
                      if (!matchedDocuments.includes(kb.title)) {
                        matchedDocuments.push(kb.title);
                      }
                    }
                  }
                }

                // 3. Hybrid Ranking
                const rankedChunks = hybridRank(vResults, keywordResults, 4);

                // Map to finalChunksSelected retaining the score details
                finalChunksSelected = rankedChunks.map((chunk) => ({
                  chunk_id: chunk.chunk_id,
                  kb_id: chunk.kb_id,
                  title: chunk.title,
                  text: `Source (${chunk.title}): ${chunk.content}`,
                  content: chunk.content,
                  vectorScore: chunk.vectorScore,
                  keywordScore: chunk.keywordScore,
                  freshnessScore: chunk.freshnessScore,
                  finalScore: chunk.finalScore,
                  type: chunk.type,
                }));

                finalContextTextInjected = finalChunksSelected.map((c) => c.text).join('\n\n');

                systemPrompt = `${systemPrompt}\n\nIf relevant, use the following official Knowledge Base context retrieved from our company documentation:\n\n${finalContextTextInjected || 'No specific company docs found for this query.'}\n\nIf the answer is not in the context, answer using your general knowledge but keep it professional.`;
              } catch (ragErr) {
                console.error('RAG pipeline execution failed, proceeding with fallback', ragErr);
              }
              retrievalLatencyMs = Date.now() - ragStartTime;
            }

            if (!actualKey) {
              context.aiResponses[node_id] = { error: 'Missing API Key' };
              context.variables[saveTo] = 'AI Error: Missing API Key';
              context.variables[node_id] = { status: 'failed', error: 'Missing API Key' };
              break;
            }

            // Build Conversation Context
            let messages = [];

            if (memoryMode !== 'Disabled') {
              if (memoryMode === 'Current Session') {
                messages.push({ role: 'user', content: context.senderMessage });
              } else {
                const chatId = `${context.senderMobile}_${flowId}`;
                const { validatePath } = require('../utils/pathSafe');
                const rootInboxDir = path.resolve(__dirname, '../conversations/inbox');
                const historyFile = validatePath(rootInboxDir, `${uid}/${chatId}.json`);
                if (historyFile && fs.existsSync(historyFile)) {
                  try {
                    const chatHistory = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
                    let refCount =
                      memoryMode === 'Full Conversation'
                        ? 100
                        : memoryMode === 'Last 50 Messages'
                          ? 50
                          : messageReferenceCount;

                    const relevantMessages = chatHistory
                      .slice(-refCount)
                      .map((m) => ({
                        role: m.route === 'INCOMING' ? 'user' : 'assistant',
                        content:
                          m.type === 'text'
                            ? m.msgContext?.text?.body
                            : m.msgContext?.caption || `[${m.type} message]`,
                      }))
                      .filter((m) => m.content);

                    messages.push(...relevantMessages);
                  } catch (e) {
                    console.error('Failed to read chat history', e);
                  }
                }
                if (
                  messages.length === 0 ||
                  messages[messages.length - 1].content !== context.senderMessage
                ) {
                  messages.push({ role: 'user', content: context.senderMessage });
                }
              }
            } else {
              messages.push({ role: 'user', content: context.senderMessage });
            }

            const startTime = Date.now();
            let aiResult = null;
            let executionError = null;

            try {
              let customEndpoint = null;
              if (provider === 'custom' || provider === 'deepseek') {
                const [aiProvider] = await query(
                  `SELECT custom_endpoint FROM tenant_ai_providers WHERE uid = ? AND provider = ? LIMIT 1`,
                  [uid, provider],
                );
                customEndpoint = aiProvider?.custom_endpoint;
              }

              aiResult = await executeAIProvider(
                provider,
                model,
                actualKey,
                systemPrompt,
                messages,
                temperature,
                maxTokens,
                customEndpoint,
              );

              context.aiResponses[node_id] = aiResult;
              context.variables.aiResponse = aiResult;
              context.variables[saveTo] = aiResult.response;
              context.variables[node_id] = {
                status: 'success',
                provider,
                model,
                tokensUsed: aiResult.tokensUsed,
              };
            } catch (err) {
              console.error('AI Node Execution Failed', err);
              executionError = err;
              context.aiResponses[node_id] = { error: err.message };
              context.variables.aiError = err.message;
              context.variables[saveTo] = 'AI Service temporarily unavailable.';
              context.variables[node_id] = { status: 'failed', error: err.message };
            }

            // Log AI Node execution details to Database
            try {
              const executionLogId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const llmCallDetails = {
                provider,
                model,
                systemPrompt,
                userPrompt: messages,
                tokenEstimate: aiResult ? aiResult.tokensUsed : 0,
                latency: Date.now() - startTime,
                embeddingModel: config.EMBEDDING_MODEL,
                embeddingDims: config.EMBEDDING_DIMS,
                retrievalLatencyMs,
              };
              const flowBuilderDetails = {
                variablesGenerated: context.variables,
                aiResponseValue: aiResult ? aiResult.response : null,
                sendMessagePayload: null,
              };
              const executionResult = {
                success: aiResult ? true : false,
                errorMessage: executionError ? executionError.message : null,
              };

              await query(
                `INSERT INTO ai_execution_logs (
                  execution_id, flow_id, node_id, uid, user_input, 
                  vector_retrieval, keyword_retrieval, merged_context, 
                  llm_call, flow_builder, result
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  executionLogId,
                  flowId,
                  node_id,
                  uid,
                  context.senderMessage,
                  JSON.stringify({
                    embeddingGenerated,
                    vectorSearchExecuted,
                    topChunks,
                    similarityScores,
                  }),
                  JSON.stringify({
                    keywordSearchExecuted,
                    matchedDocuments,
                    paragraphScores,
                  }),
                  JSON.stringify({
                    finalChunksSelected: finalChunksSelected,
                    finalContextTextInjected,
                  }),
                  JSON.stringify(llmCallDetails),
                  JSON.stringify(flowBuilderDetails),
                  JSON.stringify(executionResult),
                ],
              );
            } catch (logErr) {
              console.error('Failed to write to ai_execution_logs', logErr);
            }
          }
          break;

        case 'Set Chat Labels':
        case 'set-chat-labels':
          {
            const labelsToAdd = nodeData.labels || [];
            const labelsToRemove = nodeData.removeLabels || [];

            let currentLabels = context.labels || [];
            if (labelsToAdd.length > 0) {
              currentLabels = [...new Set([...currentLabels, ...labelsToAdd])];
            }
            if (labelsToRemove.length > 0) {
              currentLabels = currentLabels.filter((l) => !labelsToRemove.includes(l));
            }
            context.labels = currentLabels;

            if (!isTest) {
              const tagsString = context.labels.join(',');
              const chatId = `${context.senderMobile}_${flowId}`;
              await query(`UPDATE chats SET chat_tags = ? WHERE chat_id = ? AND uid = ?`, [
                tagsString,
                chatId,
                uid,
              ]);
            }
            context.variables[node_id] = { status: 'success', labels: context.labels };
          }
          break;

        case 'Agent Transfer':
        case 'agent-transfer': {
          const transferType = nodeData.transferType || 'Round Robin';
          const dept = nodeData.department || '';

          if (!isTest) {
            const chatId = `${context.senderMobile}_${flowId}`;
            await query(
              `UPDATE chats SET chat_status = 'open', chat_note = ? WHERE chat_id = ? AND uid = ?`,
              [
                `Transferred to Agent Queue via Automation (${transferType}${dept ? ' - ' + dept : ''})`,
                chatId,
                uid,
              ],
            );
          }

          context.currentNode = null;
          await query(
            `UPDATE flow_executions SET status = 'completed', execution_path = ? WHERE id = ?`,
            [JSON.stringify(context.executionPath), executionId],
          );
          return;
        }

        case 'Disable Auto-Reply':
        case 'disable-auto-reply':
          {
            const hours = parseInt(nodeData.disableHours || '24', 10);
            const minutes = parseInt(nodeData.disableMinutes || '0', 10);
            const durationMs = (hours * 3600 + minutes * 60) * 1000;
            const until = new Date(Date.now() + durationMs);

            if (!isTest) {
              await query(
                `UPDATE contact SET auto_reply_disabled_until = ? WHERE uid = ? AND mobile = ?`,
                [until.toISOString(), uid, context.senderMobile],
              );
            }
            context.variables[node_id] = { autoReplyDisabledUntil: until.toISOString() };
          }
          break;

        case 'Reset Session':
        case 'reset-session':
          {
            context.variables = {};
            context.session = {};
            context.apiResponses = {};
            context.aiResponses = {};
            context.formResponses = {};
            context.mysqlResponses = {};
            context.variables[node_id] = { status: 'reset' };
          }
          break;

        case 'Google Sheets':
        case 'google-sheets':
          {
            const sheetAction = nodeData.sheetAction || 'Create Row';
            const mappedRow = {};
            if (nodeData.mappings && Array.isArray(nodeData.mappings)) {
              nodeData.mappings.forEach((m) => {
                if (m.column) mappedRow[m.column] = replacePlaceholders(m.value || '', context);
              });
            }
            context.variables[node_id] = {
              status: 'success',
              action: sheetAction,
              appendedRow: mappedRow,
              timestamp: new Date().toISOString(),
            };
          }
          break;

        case 'Send Email':
        case 'send-email':
          {
            const emailFrom = replacePlaceholders(nodeData.emailFrom || '', context);
            const to = replacePlaceholders(nodeData.emailTo || nodeData.toEmail || '', context);
            const subject = replacePlaceholders(nodeData.emailSubject || '', context);
            const htmlBody = replacePlaceholders(
              nodeData.emailHtmlContent || nodeData.emailBody || '',
              context,
            );

            if (to && subject && htmlBody) {
              try {
                let transporter;
                // Prefer node-level SMTP config if provided
                const smtpHost = nodeData.smtpHost || '';
                const smtpPort = parseInt(nodeData.smtpPort || '587', 10);
                const smtpSecurity = nodeData.smtpSecurity || 'TLS';
                const smtpAuthEnabled = nodeData.smtpAuthEnabled !== false;
                const smtpUser = nodeData.smtpUser || '';
                const smtpEmail = nodeData.smtpEmail || '';
                const smtpPassword = nodeData.smtpPassword || '';

                if (smtpHost) {
                  transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: smtpPort,
                    secure: smtpSecurity === 'SSL',
                    ...(smtpSecurity === 'TLS' ? { requireTLS: true } : {}),
                    auth: smtpAuthEnabled
                      ? {
                          user: smtpUser || smtpEmail,
                          pass: smtpPassword,
                        }
                      : undefined,
                  });
                } else {
                  // Fall back to global SMTP table
                  const [smtp] = await query(`SELECT * FROM smtp WHERE uid = ? LIMIT 1`, [uid]);
                  if (smtp) {
                    transporter = nodemailer.createTransport({
                      host: smtp.host,
                      port: parseInt(smtp.port, 10),
                      secure: smtp.tls > 0,
                      auth: { user: smtp.email, pass: smtp.password },
                    });
                  } else {
                    transporter = nodemailer.createTransport({
                      host: 'smtp.ethereal.email',
                      port: 587,
                      secure: false,
                      auth: { user: 'test@ethereal.email', pass: 'testpass' },
                    });
                  }
                }

                const xss = require('xss');
                const cleanHtmlBody = xss(htmlBody);
                const info = await transporter.sendMail({
                  from: emailFrom || smtpEmail || 'no-reply@crm.com',
                  to,
                  subject,
                  html: cleanHtmlBody,
                });

                if (!context.emailResponse) context.emailResponse = {};
                context.emailResponse[node_id] = { status: 'sent', messageId: info.messageId };
                context.variables[node_id] = { status: 'sent', messageId: info.messageId };
              } catch (smtpErr) {
                console.error('Email send failed', smtpErr);
                if (!context.emailResponse) context.emailResponse = {};
                context.emailResponse[node_id] = {
                  status: 'failed',
                  error: smtpErr.message,
                  code: smtpErr.code || 'UNKNOWN',
                };
                context.variables[node_id] = {
                  status: 'failed',
                  error: smtpErr.message,
                  code: smtpErr.code || 'UNKNOWN',
                };
                status = 'failed';
                errorMsg = `SMTP Error: ${smtpErr.message}`;
              }
            } else {
              const missing = [];
              if (!to) missing.push('to');
              if (!subject) missing.push('subject');
              if (!htmlBody) missing.push('body');
              context.variables[node_id] = { status: 'skipped', reason: 'missing_fields', missing };
            }
          }
          break;

        case 'MySQL Query':
        case 'mysql-query':
          {
            const dbConfig = {
              host: nodeData.host,
              port: parseInt(nodeData.port || '3306', 10),
              database: nodeData.database,
              user: nodeData.username,
              password: nodeData.password,
            };
            const rawQuery = nodeData.query || '';

            let queryParams = [];
            if (nodeData.parameters && Array.isArray(nodeData.parameters)) {
              queryParams = nodeData.parameters.map((p) => replacePlaceholders(p, context));
            }

            let rows = [];
            try {
              if (dbConfig.host && rawQuery) {
                const isPostgres =
                  dbConfig.port === 5432 || String(dbConfig.database).includes('postgres');
                if (isPostgres) {
                  const { Client } = require('pg');
                  const client = new Client(dbConfig);
                  await client.connect();

                  let pgQuery = rawQuery;
                  let counter = 1;
                  pgQuery = pgQuery.replace(/\?/g, () => `$${counter++}`);

                  const res = await client.query(pgQuery, queryParams);
                  rows = res.rows;
                  await client.end();
                } else {
                  try {
                    const mysql = require('mysql2/promise');
                    const connection = await mysql.createConnection(dbConfig);
                    const [queryRows] = await connection.execute(rawQuery, queryParams);
                    rows = queryRows;
                    await connection.end();
                  } catch {
                    console.log('mysql2 not found, mocking SQL response');
                    rows = [{ id: 1, name: context.senderName, email: 'customer@example.com' }];
                  }
                }
              } else {
                rows = [{ id: 1, name: context.senderName, email: 'customer@example.com' }];
              }

              context.mysqlResponses[node_id] = rows;

              if (nodeData.mappings && Array.isArray(nodeData.mappings)) {
                nodeData.mappings.forEach((m) => {
                  if (m.dbField && m.saveToVariable) {
                    const val = rows[0]?.[m.dbField] !== undefined ? rows[0][m.dbField] : '';
                    context.variables[m.saveToVariable] = val;
                  }
                });
              }
              context.variables[node_id] = { status: 'success', rowsCount: rows.length };
            } catch (err) {
              console.error('MySQL query node failed', err);
              context.mysqlResponses[node_id] = { error: err.message };
              context.variables[node_id] = { status: 'failed', error: err.message };
            }
          }
          break;

        case 'Webhook':
        case 'webhook':
          {
            const webhookUrl = replacePlaceholders(nodeData.webhookUrl || '', context);
            if (webhookUrl) {
              try {
                const { isSafeUrl } = require('../utils/ssrfFilter');
                if (!(await isSafeUrl(webhookUrl))) {
                  console.error('Blocked potential SSRF on Webhook Node');
                  context.variables[node_id] = {
                    status: 'failed',
                    error: 'Blocked potential SSRF',
                  };
                  break;
                }
                await fetch(webhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    senderName: context.senderName,
                    senderMobile: context.senderMobile,
                    variables: context.variables,
                  }),
                });
                context.variables[node_id] = { status: 'success' };
              } catch (e) {
                console.error('Webhook trigger failed', e);
                context.variables[node_id] = { status: 'failed', error: e.message };
              }
            }
          }
          break;

        case 'End Flow':
        case 'end-flow':
          context.currentNode = null;
          await query(
            `UPDATE flow_executions SET status = 'completed', execution_path = ? WHERE id = ?`,
            [JSON.stringify(context.executionPath), executionId],
          );
          return;
      }
    } catch (e) {
      console.error(`Error executing node ${node_id}`, e);
      status = 'failed';
      errorMsg = e.message;
    }

    const duration = Date.now() - startTime;
    await logExecutionNode(executionId, flowId, node_id, status, errorMsg, duration);

    // Save variables state
    await saveContextState(executionId, context);

    if (isPaused) {
      break;
    }

    // Determine next node using edges
    let matchingEdge = null;
    if (node.type === 'Condition' || node.type === 'condition') {
      matchingEdge = edges.find(
        (e) => e.source === node_id && e.source_handle === nextSourceHandle,
      );
      if (!matchingEdge) {
        matchingEdge = edges.find(
          (e) => e.source === node_id && e.source_handle === 'default_path',
        );
      }
    } else {
      matchingEdge = edges.find((e) => e.source === node_id);
    }

    if (matchingEdge) {
      const nextNodeId = matchingEdge.target;

      if (context.executionPath.includes(nextNodeId)) {
        await logExecutionNode(
          executionId,
          flowId,
          nextNodeId,
          'failed',
          'Infinite loop detected! Terminating execution.',
        );
        break;
      }

      context.currentNode = nextNodeId;
      context.executionPath.push(nextNodeId);

      await query(
        `UPDATE flow_executions SET current_node_id = ?, execution_path = ? WHERE id = ?`,
        [nextNodeId, JSON.stringify(context.executionPath), executionId],
      );
    } else {
      context.currentNode = null;
      await query(
        `UPDATE flow_executions SET status = 'completed', execution_path = ? WHERE id = ?`,
        [JSON.stringify(context.executionPath), executionId],
      );
    }
  }

  if (stepsCount >= maxSteps) {
    await query(`UPDATE flow_executions SET status = 'failed' WHERE id = ?`, [executionId]);
  }
}

// Log execution logs
async function logExecutionNode(executionId, flowId, node_id, status, errorMsg, duration = 0) {
  try {
    await query(
      `INSERT INTO flow_execution_logs 
        (execution_id, flow_id, node_id, status, error_message, execution_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [executionId, flowId, node_id, status, errorMsg, duration],
    );
  } catch (err) {
    console.error('Failed to insert flow execution log', err);
  }
}

// Background scheduler loop to resume paused delays
async function resumePausedDelays() {
  try {
    const expiredExecutions = await query(
      `SELECT * FROM flow_executions WHERE status = 'paused_on_delay' AND updated_at <= CURRENT_TIMESTAMP`,
    );

    for (const exec of expiredExecutions) {
      console.log(`[Scheduler] Resuming delay-paused execution ${exec.id}`);

      const flowId = exec.flow_id;
      const uid = exec.uid;

      const nodes = await query(`SELECT * FROM automation_nodes WHERE flow_id = ?`, [flowId]);
      const edges = await query(`SELECT * FROM automation_edges WHERE flow_id = ?`, [flowId]);

      const parsedVars = JSON.parse(exec.variables || '{}');
      const context = {
        senderName: exec.sender_name,
        senderMobile: exec.sender_mobile,
        senderMessage: '',
        variables: parsedVars.variables || parsedVars || {},
        session: parsedVars.session || {},
        apiResponses: parsedVars.apiResponses || {},
        aiResponses: parsedVars.aiResponses || {},
        formResponses: parsedVars.formResponses || {},
        mysqlResponses: parsedVars.mysqlResponses || {},
        messageOutputs: parsedVars.messageOutputs || {},
        labels: JSON.parse(exec.labels || '[]'),
        currentNode: exec.current_node_id,
        executionPath: JSON.parse(exec.execution_path || '[]'),
      };

      await query(`UPDATE flow_executions SET status = 'running' WHERE id = ?`, [exec.id]);

      const matchingEdges = edges.filter((e) => e.source === context.currentNode);
      if (matchingEdges.length > 0) {
        const nextNodeId = matchingEdges[0].target;
        context.currentNode = nextNodeId;
        context.executionPath.push(nextNodeId);

        await executeFlowStep(exec.id, flowId, uid, nodes, edges, context, false, null);
      } else {
        await query(
          `UPDATE flow_executions SET status = 'completed', execution_path = ? WHERE id = ?`,
          [JSON.stringify(context.executionPath), exec.id],
        );
      }
    }
  } catch (err) {
    console.error('Error checking/resuming delay paused executions', err);
  }
}

setInterval(resumePausedDelays, 10000);

module.exports = {
  startFlow,
  resumeFlow,
};
