import { create } from 'zustand'
import { apiRequest } from '../shared/api'

export const useChatbotAutomationStore = create((set, get) => ({
  flows: [],
  selectedFlow: null,
  nodes: [],
  edges: [],
  isNodeMenuOpen: false,
  isTesterOpen: false,
  isInspectorOpen: false,
  searchQuery: '',
  language: 'en_US',
  
  // Inspection & Simulation states
  selectedNodeId: null,
  simulationResult: null, // { execution: { status, executionPath, variables, labels }, logs: [] }
  isSimulating: false,
  simulationInputs: {
    message: 'hi',
    phone: '+15550001111',
    name: 'John Doe',
    variables: '{}'
  },

  setFlows: (flows) => set({ flows }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setIsNodeMenuOpen: (isNodeMenuOpen) => set({ isNodeMenuOpen }),
  setIsTesterOpen: (isTesterOpen) => set({ isTesterOpen }),
  setIsInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLanguage: (language) => set({ language }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setSimulationInputs: (inputs) => set((state) => ({ simulationInputs: { ...state.simulationInputs, ...inputs } })),
  setSimulationResult: (simulationResult) => set({ simulationResult }),

  // Load all flows
  loadFlows: async (token) => {
    try {
      const res = await apiRequest('/api/chatbot-automation/flows', { token })
      if (res?.success) {
        set({ flows: res.data || [] })
      }
    } catch (err) {
      console.error('Failed to load flows', err)
    }
  },

  // Select flow and load details
  selectFlow: async (flow, token) => {
    if (!flow) {
      set({ selectedFlow: null, nodes: [], edges: [], selectedNodeId: null, simulationResult: null })
      return
    }

    try {
      const res = await apiRequest(`/api/chatbot-automation/flows/${flow.flow_id}`, { token })
      if (res?.success) {
        set({
          selectedFlow: res.flow,
          nodes: res.nodes || [],
          edges: res.edges || [],
          selectedNodeId: null,
          simulationResult: null
        })
      }
    } catch (err) {
      console.error('Failed to fetch flow details', err)
    }
  },

  // Create flow
  createNewFlow: async (token) => {
    const flowId = `flow-${Date.now()}`
    const newFlow = {
      flowId,
      name: 'New Automation Flow',
      nodes: [
        {
          id: 'initial-node',
          type: 'initial',
          position: { x: 250, y: 150 },
          data: { label: 'Initial Node', source: 'Chatbot' }
        }
      ],
      edges: [],
      isPublished: false
    }

    try {
      const res = await apiRequest('/api/chatbot-automation/flows', {
        method: 'POST',
        token,
        body: newFlow
      })
      if (res?.success) {
        await get().loadFlows(token)
        const updatedFlow = get().flows.find(f => f.flow_id === flowId)
        if (updatedFlow) {
          await get().selectFlow(updatedFlow, token)
        }
      } else {
        alert(res?.msg || 'Failed to create new flow')
      }
    } catch (err) {
      console.error('Failed to create flow', err)
      alert('Error creating flow')
    }
  },

  // Save flow nodes/edges
  saveCurrentFlow: async (token) => {
    const { selectedFlow, nodes, edges } = get()
    if (!selectedFlow) return

    try {
      const payload = {
        flowId: selectedFlow.flow_id,
        name: selectedFlow.title || selectedFlow.name,
        isPublished: selectedFlow.isPublished,
        nodes,
        edges
      }

      const res = await apiRequest('/api/chatbot-automation/flows', {
        method: 'POST',
        token,
        body: payload
      })
      if (res?.success) {
        await get().loadFlows(token)
      }
      return res
    } catch (err) {
      console.error('Failed to save flow', err)
      return { success: false, msg: 'Network error' }
    }
  },

  // Toggle Publish
  togglePublishFlow: async (token) => {
    const { selectedFlow } = get()
    if (!selectedFlow) return

    const nextPublished = !selectedFlow.isPublished
    try {
      const res = await apiRequest('/api/chatbot-automation/flows/publish', {
        method: 'POST',
        token,
        body: { flowId: selectedFlow.flow_id, isPublished: nextPublished }
      })
      if (res?.success) {
        set((state) => ({
          selectedFlow: { ...state.selectedFlow, isPublished: nextPublished }
        }))
        await get().loadFlows(token)
      }
    } catch (err) {
      console.error('Failed to publish flow', err)
    }
  },

  // Duplicate flow
  duplicateExistingFlow: async (flowId, token) => {
    try {
      const res = await apiRequest('/api/chatbot-automation/flows/duplicate', {
        method: 'POST',
        token,
        body: { flowId }
      })
      if (res?.success) {
        await get().loadFlows(token)
      }
    } catch (err) {
      console.error('Failed to duplicate flow', err)
    }
  },

  // Delete flow
  deleteExistingFlow: async (flowId, token) => {
    try {
      const res = await apiRequest('/api/chatbot-automation/flows/delete', {
        method: 'POST',
        token,
        body: { flowId }
      })
      if (res?.success) {
        const isSelectedDeleted = get().selectedFlow?.flow_id === flowId
        if (isSelectedDeleted) {
          set({ selectedFlow: null, nodes: [], edges: [], selectedNodeId: null, simulationResult: null })
        }
        await get().loadFlows(token)
      }
    } catch (err) {
      console.error('Failed to delete flow', err)
    }
  },

  // Run tester simulation
  runSimulation: async (token) => {
    const { selectedFlow, simulationInputs } = get()
    if (!selectedFlow) return

    set({ isSimulating: true, simulationResult: null })
    try {
      let parsedVars = {}
      try {
        parsedVars = JSON.parse(simulationInputs.variables || '{}')
      } catch (e) {
        console.warn('Invalid JSON in simulation variables')
      }

      const res = await apiRequest('/api/chatbot-automation/flows/test', {
        method: 'POST',
        token,
        body: {
          flowId: selectedFlow.flow_id,
          message: simulationInputs.message,
          phone: simulationInputs.phone,
          name: simulationInputs.name,
          variables: parsedVars
        }
      })

      if (res?.success) {
        set({ simulationResult: res })
      }
    } catch (err) {
      console.error('Failed to run simulation', err)
    } finally {
      set({ isSimulating: false })
    }
  },

  // Node specific helper: Update selected node data properties
  updateNodeData: (nodeId, key, value) => {
    set((state) => {
      const nextNodes = state.nodes.map((n) => {
        if (n.id === nodeId) {
          const newData = JSON.parse(JSON.stringify(n.data))
          if (key.includes('.') || key.includes('[')) {
            const parts = key.replace(/\[(\d+)\]/g, '.$1').split('.')
            let current = newData
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i]
              if (current[part] === undefined) {
                current[part] = isNaN(parts[i + 1]) ? {} : []
              }
              current = current[part]
            }
            current[parts[parts.length - 1]] = value
          } else {
            newData[key] = value
          }
          return {
            ...n,
            data: newData
          }
        }
        return n
      })
      return { nodes: nextNodes }
    })
  },

  lastFocusedInput: null, // { nodeId, field }
  setLastFocusedInput: (lastFocusedInput) => set({ lastFocusedInput }),

  duplicateNode: (nodeId) => {
    set((state) => {
      const originalNode = state.nodes.find((n) => n.id === nodeId)
      if (!originalNode) return {}

      const newNodeId = `node-${Date.now()}`
      const newNode = {
        ...originalNode,
        id: newNodeId,
        position: {
          x: originalNode.position.x + 50,
          y: originalNode.position.y + 50
        },
        selected: false,
        dragging: false,
        data: {
          ...originalNode.data
        }
      }

      // Clone edges
      const newEdges = [...state.edges]
      state.edges.forEach((edge) => {
        if (edge.source === nodeId) {
          newEdges.push({
            ...edge,
            id: `edge-${newNodeId}-${edge.target}-${Date.now().toString(36)}`,
            source: newNodeId
          })
        }
        if (edge.target === nodeId) {
          newEdges.push({
            ...edge,
            id: `edge-${edge.source}-${newNodeId}-${Date.now().toString(36)}`,
            target: newNodeId
          })
        }
      })

      return {
        nodes: [...state.nodes, newNode],
        edges: newEdges
      }
    })
  },

  deleteNode: (nodeId) => {
    set((state) => {
      const nextNodes = state.nodes.filter((n) => n.id !== nodeId)
      const nextEdges = state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
      const nextSelectedId = state.selectedNodeId === nodeId ? null : state.selectedNodeId
      return {
        nodes: nextNodes,
        edges: nextEdges,
        selectedNodeId: nextSelectedId
      }
    })
  }
}))
