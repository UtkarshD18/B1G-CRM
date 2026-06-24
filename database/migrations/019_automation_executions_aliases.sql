-- Create views/aliases to align with database requirements while maintaining compatibility with flow_executions code paths
CREATE OR REPLACE VIEW automation_executions AS SELECT * FROM flow_executions;
CREATE OR REPLACE VIEW automation_execution_logs AS SELECT * FROM flow_execution_logs;
CREATE OR REPLACE VIEW automation_variables AS SELECT * FROM flow_variables;
