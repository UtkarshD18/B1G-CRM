--
-- PostgreSQL database dump
--

\restrict coqCfRSCm2gadZtQkO9ftmHMPuqS4TQUgxzegUImmh21kAn06Pl1XyYRj6N0gjb

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg12+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: b1gcrm
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO b1gcrm;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: b1gcrm
--

COMMENT ON SCHEMA public IS '';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: notify_channel_incoming_queue_insert(); Type: FUNCTION; Schema: public; Owner: b1gcrm
--

CREATE FUNCTION public.notify_channel_incoming_queue_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM pg_notify('channel_incoming_queue', NEW.id::text);
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_channel_incoming_queue_insert() OWNER TO b1gcrm;

--
-- Name: notify_channel_outgoing_queue_insert(); Type: FUNCTION; Schema: public; Owner: b1gcrm
--

CREATE FUNCTION public.notify_channel_outgoing_queue_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM pg_notify('channel_outgoing_queue', NEW.id::text);
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_channel_outgoing_queue_insert() OWNER TO b1gcrm;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    uid character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    action character varying(255) NOT NULL,
    module character varying(100) NOT NULL,
    target character varying(255),
    details text,
    execution_id character varying(255) DEFAULT NULL::character varying,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(50)
);


ALTER TABLE public.activity_logs OWNER TO b1gcrm;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO b1gcrm;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: admin; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.admin (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'admin'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin OWNER TO b1gcrm;

--
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_id_seq OWNER TO b1gcrm;

--
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- Name: agent_chats; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.agent_chats (
    id integer NOT NULL,
    owner_uid character varying(191) NOT NULL,
    uid character varying(191) NOT NULL,
    chat_id character varying(255) NOT NULL,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agent_chats OWNER TO b1gcrm;

--
-- Name: agent_chats_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.agent_chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agent_chats_id_seq OWNER TO b1gcrm;

--
-- Name: agent_chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.agent_chats_id_seq OWNED BY public.agent_chats.id;


--
-- Name: agent_response_logs; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.agent_response_logs (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    agent_uid character varying(191) NOT NULL,
    chat_id character varying(255) NOT NULL,
    response_time_seconds integer NOT NULL,
    sla_violated smallint DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agent_response_logs OWNER TO b1gcrm;

--
-- Name: agent_response_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.agent_response_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agent_response_logs_id_seq OWNER TO b1gcrm;

--
-- Name: agent_response_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.agent_response_logs_id_seq OWNED BY public.agent_response_logs.id;


--
-- Name: agent_task; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.agent_task (
    id integer NOT NULL,
    owner_uid character varying(191) NOT NULL,
    uid character varying(191) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    agent_comments text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agent_task OWNER TO b1gcrm;

--
-- Name: agent_task_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.agent_task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agent_task_id_seq OWNER TO b1gcrm;

--
-- Name: agent_task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.agent_task_id_seq OWNED BY public.agent_task.id;


--
-- Name: agents; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.agents (
    id integer NOT NULL,
    owner_uid character varying(191) NOT NULL,
    uid character varying(191) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'agent'::character varying,
    name character varying(255),
    mobile character varying(50),
    comments text,
    is_active smallint DEFAULT 1,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    permissions text DEFAULT '[]'::text
);


ALTER TABLE public.agents OWNER TO b1gcrm;

--
-- Name: agents_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.agents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agents_id_seq OWNER TO b1gcrm;

--
-- Name: agents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.agents_id_seq OWNED BY public.agents.id;


--
-- Name: ai_execution_logs; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.ai_execution_logs (
    id integer NOT NULL,
    execution_id character varying(191) NOT NULL,
    flow_id character varying(191) NOT NULL,
    node_id character varying(191) NOT NULL,
    uid character varying(191) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_input text,
    vector_retrieval text,
    keyword_retrieval text,
    merged_context text,
    llm_call text,
    flow_builder text,
    result text
);


ALTER TABLE public.ai_execution_logs OWNER TO b1gcrm;

--
-- Name: ai_execution_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.ai_execution_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_execution_logs_id_seq OWNER TO b1gcrm;

--
-- Name: ai_execution_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.ai_execution_logs_id_seq OWNED BY public.ai_execution_logs.id;


--
-- Name: ai_feedback; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.ai_feedback (
    id integer NOT NULL,
    uid character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    execution_id character varying(255) NOT NULL,
    rating character varying(10) NOT NULL,
    comment text,
    model character varying(100),
    flow_id character varying(100),
    conversation_id character varying(100),
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ai_feedback OWNER TO b1gcrm;

--
-- Name: ai_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.ai_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_feedback_id_seq OWNER TO b1gcrm;

--
-- Name: ai_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.ai_feedback_id_seq OWNED BY public.ai_feedback.id;


--
-- Name: automation_edges; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.automation_edges (
    id integer NOT NULL,
    flow_id character varying(255) NOT NULL,
    edge_id character varying(255) NOT NULL,
    source character varying(255) NOT NULL,
    target character varying(255) NOT NULL,
    source_handle character varying(255),
    target_handle character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.automation_edges OWNER TO b1gcrm;

--
-- Name: automation_edges_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.automation_edges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.automation_edges_id_seq OWNER TO b1gcrm;

--
-- Name: automation_edges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.automation_edges_id_seq OWNED BY public.automation_edges.id;


--
-- Name: flow_execution_logs; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.flow_execution_logs (
    id integer NOT NULL,
    execution_id integer NOT NULL,
    flow_id character varying(255) NOT NULL,
    node_id character varying(255) NOT NULL,
    status character varying(50) NOT NULL,
    error_message text,
    execution_time integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.flow_execution_logs OWNER TO b1gcrm;

--
-- Name: automation_execution_logs; Type: VIEW; Schema: public; Owner: b1gcrm
--

CREATE VIEW public.automation_execution_logs AS
 SELECT id,
    execution_id,
    flow_id,
    node_id,
    status,
    error_message,
    execution_time,
    created_at
   FROM public.flow_execution_logs;


ALTER VIEW public.automation_execution_logs OWNER TO b1gcrm;

--
-- Name: flow_executions; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.flow_executions (
    id integer NOT NULL,
    flow_id character varying(255) NOT NULL,
    uid character varying(191) NOT NULL,
    sender_name character varying(255),
    sender_mobile character varying(100),
    status character varying(50) DEFAULT 'running'::character varying,
    current_node_id character varying(255),
    variables text,
    labels text,
    execution_path text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    version integer
);


ALTER TABLE public.flow_executions OWNER TO b1gcrm;

--
-- Name: automation_executions; Type: VIEW; Schema: public; Owner: b1gcrm
--

CREATE VIEW public.automation_executions AS
 SELECT id,
    flow_id,
    uid,
    sender_name,
    sender_mobile,
    status,
    current_node_id,
    variables,
    labels,
    execution_path,
    created_at,
    updated_at
   FROM public.flow_executions;


ALTER VIEW public.automation_executions OWNER TO b1gcrm;

--
-- Name: automation_flow_version_metrics; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.automation_flow_version_metrics (
    id integer NOT NULL,
    version_id integer NOT NULL,
    conversation_count integer DEFAULT 0,
    success_rate numeric(5,2) DEFAULT 0.00,
    fallback_rate numeric(5,2) DEFAULT 0.00,
    ai_calls integer DEFAULT 0,
    average_latency integer DEFAULT 0,
    average_cost numeric(10,4) DEFAULT 0.0000,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.automation_flow_version_metrics OWNER TO b1gcrm;

--
-- Name: automation_flow_version_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.automation_flow_version_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.automation_flow_version_metrics_id_seq OWNER TO b1gcrm;

--
-- Name: automation_flow_version_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.automation_flow_version_metrics_id_seq OWNED BY public.automation_flow_version_metrics.id;


--
-- Name: automation_flow_versions; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.automation_flow_versions (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    flow_id character varying(255) NOT NULL,
    version integer NOT NULL,
    status character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    flow_json jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    published_at timestamp with time zone,
    created_by character varying(255) NOT NULL,
    published_by character varying(255),
    rollback_source_version integer,
    version_notes text,
    checksum character varying(64) NOT NULL,
    release_tag character varying(50) DEFAULT 'Draft'::character varying,
    environment_id integer,
    revision integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.automation_flow_versions OWNER TO b1gcrm;

--
-- Name: automation_flow_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.automation_flow_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.automation_flow_versions_id_seq OWNER TO b1gcrm;

--
-- Name: automation_flow_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.automation_flow_versions_id_seq OWNED BY public.automation_flow_versions.id;


--
-- Name: automation_flows; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.automation_flows (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    flow_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    is_published smallint DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    revision integer DEFAULT 1 NOT NULL,
    last_saved_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_saved_by character varying(255) DEFAULT NULL::character varying,
    locked_by character varying(255) DEFAULT NULL::character varying,
    locked_at timestamp with time zone
);


ALTER TABLE public.automation_flows OWNER TO b1gcrm;

--
-- Name: automation_flows_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.automation_flows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.automation_flows_id_seq OWNER TO b1gcrm;

--
-- Name: automation_flows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.automation_flows_id_seq OWNED BY public.automation_flows.id;


--
-- Name: automation_nodes; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.automation_nodes (
    id integer NOT NULL,
    flow_id character varying(255) NOT NULL,
    node_id character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    position_x numeric(10,2),
    position_y numeric(10,2),
    data text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.automation_nodes OWNER TO b1gcrm;

--
-- Name: automation_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.automation_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.automation_nodes_id_seq OWNER TO b1gcrm;

--
-- Name: automation_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.automation_nodes_id_seq OWNED BY public.automation_nodes.id;


--
-- Name: flow_variables; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.flow_variables (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    name character varying(255) NOT NULL,
    value text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.flow_variables OWNER TO b1gcrm;

--
-- Name: automation_variables; Type: VIEW; Schema: public; Owner: b1gcrm
--

CREATE VIEW public.automation_variables AS
 SELECT id,
    uid,
    name,
    value,
    updated_at
   FROM public.flow_variables;


ALTER VIEW public.automation_variables OWNER TO b1gcrm;

--
-- Name: broadcast; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.broadcast (
    id integer NOT NULL,
    broadcast_id character varying(191) NOT NULL,
    uid character varying(191) NOT NULL,
    title text,
    templet text,
    phonebook text,
    status character varying(191) DEFAULT 'QUEUE'::character varying NOT NULL,
    schedule timestamp with time zone,
    timezone character varying(191),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.broadcast OWNER TO b1gcrm;

--
-- Name: broadcast_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.broadcast_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.broadcast_id_seq OWNER TO b1gcrm;

--
-- Name: broadcast_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.broadcast_id_seq OWNED BY public.broadcast.id;


--
-- Name: broadcast_log; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.broadcast_log (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    broadcast_id character varying(191) NOT NULL,
    templet_name text,
    sender_mobile character varying(191),
    send_to character varying(191),
    delivery_status character varying(191),
    example text,
    contact text,
    meta_msg_id character varying(191),
    delivery_time bigint,
    err text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    retry_count integer DEFAULT 0
);


ALTER TABLE public.broadcast_log OWNER TO b1gcrm;

--
-- Name: broadcast_log_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.broadcast_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.broadcast_log_id_seq OWNER TO b1gcrm;

--
-- Name: broadcast_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.broadcast_log_id_seq OWNED BY public.broadcast_log.id;


--
-- Name: channel_connections; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.channel_connections (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    channel_type character varying(50) NOT NULL,
    mode character varying(20) DEFAULT 'mock'::character varying NOT NULL,
    connection_status character varying(50) DEFAULT 'NEW'::character varying NOT NULL,
    last_verified_at timestamp with time zone,
    last_error text,
    last_heartbeat timestamp with time zone,
    api_version character varying(50),
    circuit_state character varying(20) DEFAULT 'CLOSED'::character varying NOT NULL,
    failure_count integer DEFAULT 0 NOT NULL,
    opened_at timestamp with time zone,
    last_failure_at timestamp with time zone,
    half_open_attempts integer DEFAULT 0 NOT NULL,
    rate_limit_tokens numeric(8,2) DEFAULT 10.00 NOT NULL,
    rate_limit_last_refill timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.channel_connections OWNER TO b1gcrm;

--
-- Name: channel_connections_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.channel_connections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.channel_connections_id_seq OWNER TO b1gcrm;

--
-- Name: channel_connections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.channel_connections_id_seq OWNED BY public.channel_connections.id;


--
-- Name: channel_credentials; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.channel_credentials (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    channel_type character varying(50) NOT NULL,
    credentials text NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.channel_credentials OWNER TO b1gcrm;

--
-- Name: channel_credentials_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.channel_credentials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.channel_credentials_id_seq OWNER TO b1gcrm;

--
-- Name: channel_credentials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.channel_credentials_id_seq OWNED BY public.channel_credentials.id;


--
-- Name: channel_dead_letter_queue; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.channel_dead_letter_queue (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    channel_type character varying(50) NOT NULL,
    payload jsonb NOT NULL,
    attempts integer NOT NULL,
    last_error text,
    provider_response jsonb,
    correlation_id uuid NOT NULL,
    provider_message_id character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.channel_dead_letter_queue OWNER TO b1gcrm;

--
-- Name: channel_dead_letter_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.channel_dead_letter_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.channel_dead_letter_queue_id_seq OWNER TO b1gcrm;

--
-- Name: channel_dead_letter_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.channel_dead_letter_queue_id_seq OWNED BY public.channel_dead_letter_queue.id;


--
-- Name: channel_incoming_queue; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.channel_incoming_queue (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    channel_type character varying(50) NOT NULL,
    payload jsonb NOT NULL,
    state character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_attempt_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    correlation_id uuid NOT NULL,
    processing_started_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    provider_message_id character varying(255)
);


ALTER TABLE public.channel_incoming_queue OWNER TO b1gcrm;

--
-- Name: channel_incoming_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.channel_incoming_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.channel_incoming_queue_id_seq OWNER TO b1gcrm;

--
-- Name: channel_incoming_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.channel_incoming_queue_id_seq OWNED BY public.channel_incoming_queue.id;


--
-- Name: channel_metrics; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.channel_metrics (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    channel_type character varying(50) NOT NULL,
    messages_sent integer DEFAULT 0 NOT NULL,
    messages_failed integer DEFAULT 0 NOT NULL,
    avg_latency_ms integer DEFAULT 0 NOT NULL,
    success_rate numeric(5,2) DEFAULT 0.00 NOT NULL,
    last_outage_at timestamp with time zone,
    retry_count integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.channel_metrics OWNER TO b1gcrm;

--
-- Name: channel_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.channel_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.channel_metrics_id_seq OWNER TO b1gcrm;

--
-- Name: channel_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.channel_metrics_id_seq OWNED BY public.channel_metrics.id;


--
-- Name: channel_outgoing_queue; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.channel_outgoing_queue (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    channel_type character varying(50) NOT NULL,
    payload jsonb NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    state character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    provider_message_id character varying(255),
    scheduled_at timestamp with time zone,
    expires_at timestamp with time zone,
    last_attempt_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    correlation_id uuid NOT NULL,
    processing_started_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.channel_outgoing_queue OWNER TO b1gcrm;

--
-- Name: channel_outgoing_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.channel_outgoing_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.channel_outgoing_queue_id_seq OWNER TO b1gcrm;

--
-- Name: channel_outgoing_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.channel_outgoing_queue_id_seq OWNED BY public.channel_outgoing_queue.id;


--
-- Name: channel_settings; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.channel_settings (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    channel_type character varying(50) NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.channel_settings OWNER TO b1gcrm;

--
-- Name: channel_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.channel_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.channel_settings_id_seq OWNER TO b1gcrm;

--
-- Name: channel_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.channel_settings_id_seq OWNED BY public.channel_settings.id;


--
-- Name: chat_tags; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.chat_tags (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    hex character varying(50),
    title character varying(255) NOT NULL,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_tags OWNER TO b1gcrm;

--
-- Name: chat_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.chat_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_tags_id_seq OWNER TO b1gcrm;

--
-- Name: chat_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.chat_tags_id_seq OWNED BY public.chat_tags.id;


--
-- Name: chat_widget; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.chat_widget (
    id integer NOT NULL,
    unique_id character varying(255) NOT NULL,
    uid character varying(191) NOT NULL,
    title character varying(255),
    whatsapp_number character varying(100),
    logo text,
    place character varying(100),
    size integer DEFAULT 60,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_widget OWNER TO b1gcrm;

--
-- Name: chat_widget_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.chat_widget_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_widget_id_seq OWNER TO b1gcrm;

--
-- Name: chat_widget_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.chat_widget_id_seq OWNED BY public.chat_widget.id;


--
-- Name: chatbot; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.chatbot (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    title character varying(255) NOT NULL,
    for_all smallint DEFAULT 0,
    chats text,
    flow text,
    flow_id character varying(255),
    active smallint DEFAULT 1,
    origin text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chatbot OWNER TO b1gcrm;

--
-- Name: chatbot_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.chatbot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chatbot_id_seq OWNER TO b1gcrm;

--
-- Name: chatbot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.chatbot_id_seq OWNED BY public.chatbot.id;


--
-- Name: chatbot_log; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.chatbot_log (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    chatbot_id integer,
    chatbot_title character varying(255),
    flow_id character varying(255),
    sender_number character varying(191),
    sender_name character varying(255),
    incoming_message text,
    origin character varying(50),
    matched smallint DEFAULT 0,
    status character varying(50) DEFAULT 'received'::character varying NOT NULL,
    detail text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chatbot_log OWNER TO b1gcrm;

--
-- Name: chatbot_log_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.chatbot_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chatbot_log_id_seq OWNER TO b1gcrm;

--
-- Name: chatbot_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.chatbot_log_id_seq OWNED BY public.chatbot_log.id;


--
-- Name: chats; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.chats (
    id integer NOT NULL,
    chat_id character varying(255) NOT NULL,
    uid character varying(191) NOT NULL,
    last_message_came bigint,
    sender_name text,
    sender_mobile character varying(100),
    last_message text,
    is_opened smallint DEFAULT 0,
    chat_status character varying(50) DEFAULT 'open'::character varying,
    chat_note text,
    chat_tags text,
    origin character varying(50) DEFAULT 'META'::character varying,
    profile text,
    other text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_agent_uid character varying(191),
    last_reply_by character varying(50),
    last_incoming_time bigint,
    last_outgoing_time bigint,
    sla_expires_at timestamp with time zone,
    sla_violated smallint DEFAULT 0,
    kanban_order integer DEFAULT 0
);


ALTER TABLE public.chats OWNER TO b1gcrm;

--
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chats_id_seq OWNER TO b1gcrm;

--
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- Name: contact; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.contact (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    phonebook_id integer,
    phonebook_name character varying(255),
    name character varying(255),
    mobile character varying(50) NOT NULL,
    var1 text,
    var2 text,
    var3 text,
    var4 text,
    var5 text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    auto_reply_disabled_until timestamp with time zone
);


ALTER TABLE public.contact OWNER TO b1gcrm;

--
-- Name: contact_form; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.contact_form (
    id integer NOT NULL,
    email character varying(255),
    name character varying(255),
    mobile character varying(100),
    content text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.contact_form OWNER TO b1gcrm;

--
-- Name: contact_form_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.contact_form_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_form_id_seq OWNER TO b1gcrm;

--
-- Name: contact_form_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.contact_form_id_seq OWNED BY public.contact_form.id;


--
-- Name: contact_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.contact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_id_seq OWNER TO b1gcrm;

--
-- Name: contact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.contact_id_seq OWNED BY public.contact.id;


--
-- Name: crm_lead_activities; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.crm_lead_activities (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    lead_id integer NOT NULL,
    activity_type character varying(50) NOT NULL,
    description text NOT NULL,
    agent_uid character varying(191),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.crm_lead_activities OWNER TO b1gcrm;

--
-- Name: crm_lead_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.crm_lead_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crm_lead_activities_id_seq OWNER TO b1gcrm;

--
-- Name: crm_lead_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.crm_lead_activities_id_seq OWNED BY public.crm_lead_activities.id;


--
-- Name: crm_lead_reminders; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.crm_lead_reminders (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    lead_id integer NOT NULL,
    title character varying(255) NOT NULL,
    remind_at timestamp with time zone NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.crm_lead_reminders OWNER TO b1gcrm;

--
-- Name: crm_lead_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.crm_lead_reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crm_lead_reminders_id_seq OWNER TO b1gcrm;

--
-- Name: crm_lead_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.crm_lead_reminders_id_seq OWNED BY public.crm_lead_reminders.id;


--
-- Name: crm_leads; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.crm_leads (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    name character varying(255) NOT NULL,
    mobile character varying(50) NOT NULL,
    stage character varying(50) DEFAULT 'Lead'::character varying NOT NULL,
    owner_agent_uid character varying(191),
    notes text,
    value numeric(12,2) DEFAULT 0.0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    pipeline_order integer DEFAULT 0
);


ALTER TABLE public.crm_leads OWNER TO b1gcrm;

--
-- Name: crm_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.crm_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crm_leads_id_seq OWNER TO b1gcrm;

--
-- Name: crm_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.crm_leads_id_seq OWNED BY public.crm_leads.id;


--
-- Name: environments; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.environments (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text
);


ALTER TABLE public.environments OWNER TO b1gcrm;

--
-- Name: environments_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.environments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.environments_id_seq OWNER TO b1gcrm;

--
-- Name: environments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.environments_id_seq OWNED BY public.environments.id;


--
-- Name: escalation_queue; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.escalation_queue (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    chat_id character varying(255) NOT NULL,
    reason character varying(255) NOT NULL,
    escalated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    resolved smallint DEFAULT 0,
    resolved_at timestamp with time zone
);


ALTER TABLE public.escalation_queue OWNER TO b1gcrm;

--
-- Name: escalation_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.escalation_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.escalation_queue_id_seq OWNER TO b1gcrm;

--
-- Name: escalation_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.escalation_queue_id_seq OWNED BY public.escalation_queue.id;


--
-- Name: faq; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.faq (
    id integer NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.faq OWNER TO b1gcrm;

--
-- Name: faq_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.faq_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faq_id_seq OWNER TO b1gcrm;

--
-- Name: faq_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.faq_id_seq OWNED BY public.faq.id;


--
-- Name: flow; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.flow (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    flow_id character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    prevent_list text,
    ai_list text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.flow OWNER TO b1gcrm;

--
-- Name: flow_data; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.flow_data (
    id integer NOT NULL,
    chatid character varying(255),
    uid character varying(191),
    uniqueid character varying(255),
    inputs text,
    other text,
    last_node text,
    disabled smallint DEFAULT 0,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.flow_data OWNER TO b1gcrm;

--
-- Name: flow_data_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.flow_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flow_data_id_seq OWNER TO b1gcrm;

--
-- Name: flow_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.flow_data_id_seq OWNED BY public.flow_data.id;


--
-- Name: flow_execution_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.flow_execution_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flow_execution_logs_id_seq OWNER TO b1gcrm;

--
-- Name: flow_execution_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.flow_execution_logs_id_seq OWNED BY public.flow_execution_logs.id;


--
-- Name: flow_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.flow_executions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flow_executions_id_seq OWNER TO b1gcrm;

--
-- Name: flow_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.flow_executions_id_seq OWNED BY public.flow_executions.id;


--
-- Name: flow_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.flow_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flow_id_seq OWNER TO b1gcrm;

--
-- Name: flow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.flow_id_seq OWNED BY public.flow.id;


--
-- Name: flow_templates; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.flow_templates (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    version_id integer NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100),
    thumbnail text,
    description text,
    author character varying(255),
    rating numeric(3,2) DEFAULT 5.00,
    downloads integer DEFAULT 0,
    visibility character varying(20) DEFAULT 'private'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.flow_templates OWNER TO b1gcrm;

--
-- Name: flow_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.flow_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flow_templates_id_seq OWNER TO b1gcrm;

--
-- Name: flow_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.flow_templates_id_seq OWNED BY public.flow_templates.id;


--
-- Name: flow_variables_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.flow_variables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flow_variables_id_seq OWNER TO b1gcrm;

--
-- Name: flow_variables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.flow_variables_id_seq OWNED BY public.flow_variables.id;


--
-- Name: gen_links; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.gen_links (
    id integer NOT NULL,
    wa_mobile character varying(100),
    email character varying(255),
    msg text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.gen_links OWNER TO b1gcrm;

--
-- Name: gen_links_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.gen_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gen_links_id_seq OWNER TO b1gcrm;

--
-- Name: gen_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.gen_links_id_seq OWNED BY public.gen_links.id;


--
-- Name: instagram_api; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.instagram_api (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    instagram_business_account_id character varying(255),
    access_token text,
    username character varying(255),
    name character varying(255),
    app_id character varying(255),
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.instagram_api OWNER TO b1gcrm;

--
-- Name: instagram_api_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.instagram_api_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.instagram_api_id_seq OWNER TO b1gcrm;

--
-- Name: instagram_api_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.instagram_api_id_seq OWNED BY public.instagram_api.id;


--
-- Name: instance; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.instance (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    title character varying(255),
    uniqueid character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'INIT'::character varying,
    other text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.instance OWNER TO b1gcrm;

--
-- Name: instance_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.instance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.instance_id_seq OWNER TO b1gcrm;

--
-- Name: instance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.instance_id_seq OWNED BY public.instance.id;


--
-- Name: knowledge_base; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.knowledge_base (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    source_path text,
    content text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    index_error text,
    indexed_at timestamp with time zone,
    embedding_model character varying(100),
    chunk_count integer DEFAULT 0,
    priority integer DEFAULT 0,
    retry_count integer DEFAULT 0
);


ALTER TABLE public.knowledge_base OWNER TO b1gcrm;

--
-- Name: knowledge_base_chunks; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.knowledge_base_chunks (
    id integer NOT NULL,
    kb_id integer NOT NULL,
    uid character varying(191) NOT NULL,
    chunk_index integer NOT NULL,
    content text NOT NULL,
    embedding text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    embedding_vector public.vector(768),
    doc_title character varying(500),
    source_url text,
    filename character varying(500),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.knowledge_base_chunks OWNER TO b1gcrm;

--
-- Name: knowledge_base_chunks_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.knowledge_base_chunks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knowledge_base_chunks_id_seq OWNER TO b1gcrm;

--
-- Name: knowledge_base_chunks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.knowledge_base_chunks_id_seq OWNED BY public.knowledge_base_chunks.id;


--
-- Name: knowledge_base_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.knowledge_base_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knowledge_base_id_seq OWNER TO b1gcrm;

--
-- Name: knowledge_base_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.knowledge_base_id_seq OWNED BY public.knowledge_base.id;


--
-- Name: meta_api; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.meta_api (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    waba_id text,
    business_account_id text,
    access_token text,
    business_phone_number_id text,
    app_id text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.meta_api OWNER TO b1gcrm;

--
-- Name: meta_api_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.meta_api_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meta_api_id_seq OWNER TO b1gcrm;

--
-- Name: meta_api_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.meta_api_id_seq OWNED BY public.meta_api.id;


--
-- Name: meta_templet_media; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.meta_templet_media (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    templet_name text,
    meta_hash text,
    file_name text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.meta_templet_media OWNER TO b1gcrm;

--
-- Name: meta_templet_media_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.meta_templet_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meta_templet_media_id_seq OWNER TO b1gcrm;

--
-- Name: meta_templet_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.meta_templet_media_id_seq OWNED BY public.meta_templet_media.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    payment_mode character varying(100),
    amount numeric(12,2) DEFAULT 0,
    data text,
    s_token text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.orders OWNER TO b1gcrm;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO b1gcrm;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: page; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.page (
    id integer NOT NULL,
    slug character varying(255) NOT NULL,
    title text,
    image text,
    content text,
    permanent smallint DEFAULT 0,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.page OWNER TO b1gcrm;

--
-- Name: page_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.page_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.page_id_seq OWNER TO b1gcrm;

--
-- Name: page_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.page_id_seq OWNED BY public.page.id;


--
-- Name: partners; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.partners (
    id integer NOT NULL,
    filename text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.partners OWNER TO b1gcrm;

--
-- Name: partners_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.partners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.partners_id_seq OWNER TO b1gcrm;

--
-- Name: partners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.partners_id_seq OWNED BY public.partners.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    description text
);


ALTER TABLE public.permissions OWNER TO b1gcrm;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO b1gcrm;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: phonebook; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.phonebook (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.phonebook OWNER TO b1gcrm;

--
-- Name: phonebook_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.phonebook_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.phonebook_id_seq OWNER TO b1gcrm;

--
-- Name: phonebook_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.phonebook_id_seq OWNED BY public.phonebook.id;


--
-- Name: plan; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.plan (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    short_description text NOT NULL,
    allow_tag smallint DEFAULT 0,
    allow_note smallint DEFAULT 0,
    allow_chatbot smallint DEFAULT 0,
    contact_limit integer DEFAULT 0,
    allow_api smallint DEFAULT 0,
    is_trial smallint DEFAULT 0,
    price numeric(12,2) DEFAULT 0,
    price_strike numeric(12,2) DEFAULT 0,
    plan_duration_in_days integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.plan OWNER TO b1gcrm;

--
-- Name: plan_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.plan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plan_id_seq OWNER TO b1gcrm;

--
-- Name: plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.plan_id_seq OWNED BY public.plan.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO b1gcrm;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    uid character varying(255) DEFAULT NULL::character varying,
    name character varying(50) NOT NULL,
    description text,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO b1gcrm;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO b1gcrm;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.rooms (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    socket_id text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rooms OWNER TO b1gcrm;

--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_id_seq OWNER TO b1gcrm;

--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.schema_migrations (
    filename text NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO b1gcrm;

--
-- Name: smtp; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.smtp (
    id integer NOT NULL,
    email character varying(255),
    host character varying(255),
    port character varying(50),
    password text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.smtp OWNER TO b1gcrm;

--
-- Name: smtp_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.smtp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.smtp_id_seq OWNER TO b1gcrm;

--
-- Name: smtp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.smtp_id_seq OWNED BY public.smtp.id;


--
-- Name: templets; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.templets (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    content text,
    type character varying(100),
    title character varying(255),
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.templets OWNER TO b1gcrm;

--
-- Name: templets_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.templets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.templets_id_seq OWNER TO b1gcrm;

--
-- Name: templets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.templets_id_seq OWNED BY public.templets.id;


--
-- Name: tenant_ai_providers; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.tenant_ai_providers (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    provider character varying(50) NOT NULL,
    api_key text,
    model character varying(255),
    temperature numeric(3,2) DEFAULT 0.7,
    enabled smallint DEFAULT 1,
    custom_endpoint text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tenant_ai_providers OWNER TO b1gcrm;

--
-- Name: tenant_ai_providers_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.tenant_ai_providers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenant_ai_providers_id_seq OWNER TO b1gcrm;

--
-- Name: tenant_ai_providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.tenant_ai_providers_id_seq OWNED BY public.tenant_ai_providers.id;


--
-- Name: testimonial; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.testimonial (
    id integer NOT NULL,
    title text,
    description text,
    reviewer_name text,
    reviewer_position text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.testimonial OWNER TO b1gcrm;

--
-- Name: testimonial_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.testimonial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.testimonial_id_seq OWNER TO b1gcrm;

--
-- Name: testimonial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.testimonial_id_seq OWNED BY public.testimonial.id;


--
-- Name: transport_workers; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.transport_workers (
    worker_name character varying(100) NOT NULL,
    hostname character varying(255) NOT NULL,
    pid integer NOT NULL,
    status character varying(50) NOT NULL,
    last_seen timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version character varying(50) NOT NULL
);


ALTER TABLE public.transport_workers OWNER TO b1gcrm;

--
-- Name: user; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    name character varying(255),
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'user'::character varying,
    mobile_with_country_code character varying(50),
    timezone character varying(100) DEFAULT 'Asia/Kolkata'::character varying,
    plan text,
    plan_expire bigint,
    trial smallint DEFAULT 0,
    api_key character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public."user" OWNER TO b1gcrm;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO b1gcrm;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.user_permissions (
    id integer NOT NULL,
    uid character varying(255) NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.user_permissions OWNER TO b1gcrm;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.user_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_permissions_id_seq OWNER TO b1gcrm;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.user_permissions_id_seq OWNED BY public.user_permissions.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    uid character varying(255) NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO b1gcrm;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_id_seq OWNER TO b1gcrm;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: web_private; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.web_private (
    id integer NOT NULL,
    pay_offline_id text,
    pay_offline_key text,
    offline_active smallint DEFAULT 0,
    pay_stripe_id text,
    pay_stripe_key text,
    stripe_active smallint DEFAULT 0,
    pay_paypal_id text,
    pay_paypal_key text,
    paypal_active smallint DEFAULT 0,
    rz_id text,
    rz_key text,
    rz_active smallint DEFAULT 0,
    pay_paystack_id text,
    pay_paystack_key text,
    paystack_active smallint DEFAULT 0,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    meta_app_id text,
    meta_app_secret text,
    meta_waba_id text,
    meta_business_account_id text,
    meta_access_token text,
    meta_phone_number_id text,
    insta_app_id text,
    insta_app_secret text,
    insta_business_account_id text,
    insta_access_token text,
    ai_provider_active text,
    ai_openai_key text,
    ai_openai_model text,
    ai_gemini_key text,
    ai_gemini_model text,
    ai_claude_key text,
    ai_claude_model text,
    ai_openrouter_key text,
    ai_openrouter_model text,
    ai_ollama_url text,
    ai_ollama_model text,
    ai_custom_url text,
    ai_custom_model text,
    widget_domains text,
    pay_mercadopago_id text,
    pay_mercadopago_key text,
    mercadopago_active smallint DEFAULT 0
);


ALTER TABLE public.web_private OWNER TO b1gcrm;

--
-- Name: web_private_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.web_private_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.web_private_id_seq OWNER TO b1gcrm;

--
-- Name: web_private_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.web_private_id_seq OWNED BY public.web_private.id;


--
-- Name: web_public; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.web_public (
    id integer NOT NULL,
    logo text,
    app_name character varying(255) DEFAULT 'B1G CRM'::character varying,
    custom_home text,
    is_custom_home smallint DEFAULT 0,
    meta_description text,
    currency_code character varying(20) DEFAULT 'USD'::character varying,
    currency_symbol character varying(20) DEFAULT '$'::character varying,
    home_page_tutorial text,
    chatbot_screen_tutorial text,
    broadcast_screen_tutorial text,
    login_header_footer text,
    exchange_rate numeric(12,4) DEFAULT 1,
    google_client_id text,
    google_login_active smallint DEFAULT 0,
    fb_login_app_id text,
    fb_login_app_sec text,
    fb_login_active smallint DEFAULT 0,
    rtl smallint DEFAULT 0,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.web_public OWNER TO b1gcrm;

--
-- Name: web_public_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.web_public_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.web_public_id_seq OWNER TO b1gcrm;

--
-- Name: web_public_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.web_public_id_seq OWNED BY public.web_public.id;


--
-- Name: webhook_idempotency; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.webhook_idempotency (
    id integer NOT NULL,
    provider_message_id character varying(255) NOT NULL,
    processed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.webhook_idempotency OWNER TO b1gcrm;

--
-- Name: webhook_idempotency_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.webhook_idempotency_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.webhook_idempotency_id_seq OWNER TO b1gcrm;

--
-- Name: webhook_idempotency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.webhook_idempotency_id_seq OWNED BY public.webhook_idempotency.id;


--
-- Name: webhook_logs; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.webhook_logs (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    rule_id integer,
    rule_name character varying(255),
    target_url text,
    payload text,
    response_status integer,
    response_body text,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.webhook_logs OWNER TO b1gcrm;

--
-- Name: webhook_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.webhook_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.webhook_logs_id_seq OWNER TO b1gcrm;

--
-- Name: webhook_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.webhook_logs_id_seq OWNED BY public.webhook_logs.id;


--
-- Name: webhook_rules; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.webhook_rules (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    name character varying(255) NOT NULL,
    source character varying(100) DEFAULT 'external'::character varying,
    event_type character varying(100) DEFAULT 'message'::character varying,
    match_field character varying(120) DEFAULT 'body.text'::character varying,
    match_operator character varying(40) DEFAULT 'contains'::character varying,
    match_value text,
    action_type character varying(80) DEFAULT 'tag_chat'::character varying,
    action_payload text,
    active smallint DEFAULT 1,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.webhook_rules OWNER TO b1gcrm;

--
-- Name: webhook_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.webhook_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.webhook_rules_id_seq OWNER TO b1gcrm;

--
-- Name: webhook_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.webhook_rules_id_seq OWNED BY public.webhook_rules.id;


--
-- Name: website_integrations; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.website_integrations (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    domain character varying(255) NOT NULL,
    verification_token character varying(255) NOT NULL,
    verified smallint DEFAULT 0,
    tracking_code text,
    widget_customization text,
    lead_capture_enabled smallint DEFAULT 1,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.website_integrations OWNER TO b1gcrm;

--
-- Name: website_integrations_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.website_integrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.website_integrations_id_seq OWNER TO b1gcrm;

--
-- Name: website_integrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.website_integrations_id_seq OWNED BY public.website_integrations.id;


--
-- Name: whatsapp_forms; Type: TABLE; Schema: public; Owner: b1gcrm
--

CREATE TABLE public.whatsapp_forms (
    id integer NOT NULL,
    uid character varying(191) NOT NULL,
    name character varying(255) NOT NULL,
    form_id character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'PUBLISHED'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.whatsapp_forms OWNER TO b1gcrm;

--
-- Name: whatsapp_forms_id_seq; Type: SEQUENCE; Schema: public; Owner: b1gcrm
--

CREATE SEQUENCE public.whatsapp_forms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.whatsapp_forms_id_seq OWNER TO b1gcrm;

--
-- Name: whatsapp_forms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: b1gcrm
--

ALTER SEQUENCE public.whatsapp_forms_id_seq OWNED BY public.whatsapp_forms.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- Name: agent_chats id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.agent_chats ALTER COLUMN id SET DEFAULT nextval('public.agent_chats_id_seq'::regclass);


--
-- Name: agent_response_logs id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.agent_response_logs ALTER COLUMN id SET DEFAULT nextval('public.agent_response_logs_id_seq'::regclass);


--
-- Name: agent_task id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.agent_task ALTER COLUMN id SET DEFAULT nextval('public.agent_task_id_seq'::regclass);


--
-- Name: agents id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.agents ALTER COLUMN id SET DEFAULT nextval('public.agents_id_seq'::regclass);


--
-- Name: ai_execution_logs id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.ai_execution_logs ALTER COLUMN id SET DEFAULT nextval('public.ai_execution_logs_id_seq'::regclass);


--
-- Name: ai_feedback id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.ai_feedback ALTER COLUMN id SET DEFAULT nextval('public.ai_feedback_id_seq'::regclass);


--
-- Name: automation_edges id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_edges ALTER COLUMN id SET DEFAULT nextval('public.automation_edges_id_seq'::regclass);


--
-- Name: automation_flow_version_metrics id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_flow_version_metrics ALTER COLUMN id SET DEFAULT nextval('public.automation_flow_version_metrics_id_seq'::regclass);


--
-- Name: automation_flow_versions id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_flow_versions ALTER COLUMN id SET DEFAULT nextval('public.automation_flow_versions_id_seq'::regclass);


--
-- Name: automation_flows id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_flows ALTER COLUMN id SET DEFAULT nextval('public.automation_flows_id_seq'::regclass);


--
-- Name: automation_nodes id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_nodes ALTER COLUMN id SET DEFAULT nextval('public.automation_nodes_id_seq'::regclass);


--
-- Name: broadcast id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.broadcast ALTER COLUMN id SET DEFAULT nextval('public.broadcast_id_seq'::regclass);


--
-- Name: broadcast_log id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.broadcast_log ALTER COLUMN id SET DEFAULT nextval('public.broadcast_log_id_seq'::regclass);


--
-- Name: channel_connections id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_connections ALTER COLUMN id SET DEFAULT nextval('public.channel_connections_id_seq'::regclass);


--
-- Name: channel_credentials id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_credentials ALTER COLUMN id SET DEFAULT nextval('public.channel_credentials_id_seq'::regclass);


--
-- Name: channel_dead_letter_queue id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_dead_letter_queue ALTER COLUMN id SET DEFAULT nextval('public.channel_dead_letter_queue_id_seq'::regclass);


--
-- Name: channel_incoming_queue id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_incoming_queue ALTER COLUMN id SET DEFAULT nextval('public.channel_incoming_queue_id_seq'::regclass);


--
-- Name: channel_metrics id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_metrics ALTER COLUMN id SET DEFAULT nextval('public.channel_metrics_id_seq'::regclass);


--
-- Name: channel_outgoing_queue id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_outgoing_queue ALTER COLUMN id SET DEFAULT nextval('public.channel_outgoing_queue_id_seq'::regclass);


--
-- Name: channel_settings id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_settings ALTER COLUMN id SET DEFAULT nextval('public.channel_settings_id_seq'::regclass);


--
-- Name: chat_tags id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chat_tags ALTER COLUMN id SET DEFAULT nextval('public.chat_tags_id_seq'::regclass);


--
-- Name: chat_widget id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chat_widget ALTER COLUMN id SET DEFAULT nextval('public.chat_widget_id_seq'::regclass);


--
-- Name: chatbot id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chatbot ALTER COLUMN id SET DEFAULT nextval('public.chatbot_id_seq'::regclass);


--
-- Name: chatbot_log id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chatbot_log ALTER COLUMN id SET DEFAULT nextval('public.chatbot_log_id_seq'::regclass);


--
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- Name: contact id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.contact ALTER COLUMN id SET DEFAULT nextval('public.contact_id_seq'::regclass);


--
-- Name: contact_form id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.contact_form ALTER COLUMN id SET DEFAULT nextval('public.contact_form_id_seq'::regclass);


--
-- Name: crm_lead_activities id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.crm_lead_activities ALTER COLUMN id SET DEFAULT nextval('public.crm_lead_activities_id_seq'::regclass);


--
-- Name: crm_lead_reminders id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.crm_lead_reminders ALTER COLUMN id SET DEFAULT nextval('public.crm_lead_reminders_id_seq'::regclass);


--
-- Name: crm_leads id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.crm_leads ALTER COLUMN id SET DEFAULT nextval('public.crm_leads_id_seq'::regclass);


--
-- Name: environments id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.environments ALTER COLUMN id SET DEFAULT nextval('public.environments_id_seq'::regclass);


--
-- Name: escalation_queue id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.escalation_queue ALTER COLUMN id SET DEFAULT nextval('public.escalation_queue_id_seq'::regclass);


--
-- Name: faq id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.faq ALTER COLUMN id SET DEFAULT nextval('public.faq_id_seq'::regclass);


--
-- Name: flow id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow ALTER COLUMN id SET DEFAULT nextval('public.flow_id_seq'::regclass);


--
-- Name: flow_data id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_data ALTER COLUMN id SET DEFAULT nextval('public.flow_data_id_seq'::regclass);


--
-- Name: flow_execution_logs id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_execution_logs ALTER COLUMN id SET DEFAULT nextval('public.flow_execution_logs_id_seq'::regclass);


--
-- Name: flow_executions id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_executions ALTER COLUMN id SET DEFAULT nextval('public.flow_executions_id_seq'::regclass);


--
-- Name: flow_templates id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_templates ALTER COLUMN id SET DEFAULT nextval('public.flow_templates_id_seq'::regclass);


--
-- Name: flow_variables id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_variables ALTER COLUMN id SET DEFAULT nextval('public.flow_variables_id_seq'::regclass);


--
-- Name: gen_links id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.gen_links ALTER COLUMN id SET DEFAULT nextval('public.gen_links_id_seq'::regclass);


--
-- Name: instagram_api id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.instagram_api ALTER COLUMN id SET DEFAULT nextval('public.instagram_api_id_seq'::regclass);


--
-- Name: instance id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.instance ALTER COLUMN id SET DEFAULT nextval('public.instance_id_seq'::regclass);


--
-- Name: knowledge_base id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.knowledge_base ALTER COLUMN id SET DEFAULT nextval('public.knowledge_base_id_seq'::regclass);


--
-- Name: knowledge_base_chunks id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.knowledge_base_chunks ALTER COLUMN id SET DEFAULT nextval('public.knowledge_base_chunks_id_seq'::regclass);


--
-- Name: meta_api id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.meta_api ALTER COLUMN id SET DEFAULT nextval('public.meta_api_id_seq'::regclass);


--
-- Name: meta_templet_media id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.meta_templet_media ALTER COLUMN id SET DEFAULT nextval('public.meta_templet_media_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: page id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.page ALTER COLUMN id SET DEFAULT nextval('public.page_id_seq'::regclass);


--
-- Name: partners id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.partners ALTER COLUMN id SET DEFAULT nextval('public.partners_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: phonebook id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.phonebook ALTER COLUMN id SET DEFAULT nextval('public.phonebook_id_seq'::regclass);


--
-- Name: plan id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.plan ALTER COLUMN id SET DEFAULT nextval('public.plan_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Name: smtp id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.smtp ALTER COLUMN id SET DEFAULT nextval('public.smtp_id_seq'::regclass);


--
-- Name: templets id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.templets ALTER COLUMN id SET DEFAULT nextval('public.templets_id_seq'::regclass);


--
-- Name: tenant_ai_providers id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.tenant_ai_providers ALTER COLUMN id SET DEFAULT nextval('public.tenant_ai_providers_id_seq'::regclass);


--
-- Name: testimonial id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.testimonial ALTER COLUMN id SET DEFAULT nextval('public.testimonial_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: user_permissions id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.user_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_permissions_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: web_private id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.web_private ALTER COLUMN id SET DEFAULT nextval('public.web_private_id_seq'::regclass);


--
-- Name: web_public id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.web_public ALTER COLUMN id SET DEFAULT nextval('public.web_public_id_seq'::regclass);


--
-- Name: webhook_idempotency id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.webhook_idempotency ALTER COLUMN id SET DEFAULT nextval('public.webhook_idempotency_id_seq'::regclass);


--
-- Name: webhook_logs id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.webhook_logs ALTER COLUMN id SET DEFAULT nextval('public.webhook_logs_id_seq'::regclass);


--
-- Name: webhook_rules id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.webhook_rules ALTER COLUMN id SET DEFAULT nextval('public.webhook_rules_id_seq'::regclass);


--
-- Name: website_integrations id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.website_integrations ALTER COLUMN id SET DEFAULT nextval('public.website_integrations_id_seq'::regclass);


--
-- Name: whatsapp_forms id; Type: DEFAULT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.whatsapp_forms ALTER COLUMN id SET DEFAULT nextval('public.whatsapp_forms_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.activity_logs (id, uid, user_id, action, module, target, details, execution_id, "timestamp", ip_address) FROM stdin;
\.


--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.admin (id, uid, email, password, role, created_at, updated_at, createdat, updatedat) FROM stdin;
1	local-admin-uid	admin@example.com	$2b$10$Cq43TJNAvtBjOvayM.b.gemF2cYyDNBbgHrLSof59vUBCctYPU0mC	admin	2026-06-26 02:35:30.176882+00	2026-06-26 02:35:30.176882+00	2026-06-26 02:35:30.229625+00	2026-06-26 02:35:30.229625+00
\.


--
-- Data for Name: agent_chats; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.agent_chats (id, owner_uid, uid, chat_id, createdat) FROM stdin;
\.


--
-- Data for Name: agent_response_logs; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.agent_response_logs (id, uid, agent_uid, chat_id, response_time_seconds, sla_violated, created_at) FROM stdin;
\.


--
-- Data for Name: agent_task; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.agent_task (id, owner_uid, uid, title, description, status, agent_comments, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.agents (id, owner_uid, uid, email, password, role, name, mobile, comments, is_active, created_at, updated_at, createdat, updatedat, permissions) FROM stdin;
10	tenant-uid	agent-1-uid	agent1@example.com	$2b$10$YJE8QvEYWdd98hkSjvnpJ.pAVjUpflN6Ns6i9AJJ74FC7b.5uDw/6	agent	Agent 1	919999999991	\N	1	2026-06-26 03:07:29.997603+00	2026-06-26 03:07:29.997603+00	2026-06-26 03:07:29.997603+00	2026-06-26 03:07:29.997603+00	[]
11	tenant-uid	agent-2-uid	agent2@example.com	$2b$10$YJE8QvEYWdd98hkSjvnpJ.pAVjUpflN6Ns6i9AJJ74FC7b.5uDw/6	agent	Agent 2	919999999992	\N	1	2026-06-26 03:07:29.999111+00	2026-06-26 03:07:29.999111+00	2026-06-26 03:07:29.999111+00	2026-06-26 03:07:29.999111+00	[]
1	local-user-uid	local-agent-uid	agent@example.com	$2b$10$JKnz4/.zU/kdL2edsE.Iruq0P12C3ttN2pPAA.vM2UTYCZQHlpSdW	agent	Local Agent		Local development agent	1	2026-06-26 02:35:30.176882+00	2026-06-26 02:35:30.176882+00	2026-06-26 02:35:30.229625+00	2026-06-26 02:35:30.229625+00	[]
\.


--
-- Data for Name: ai_execution_logs; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.ai_execution_logs (id, execution_id, flow_id, node_id, uid, "timestamp", user_input, vector_retrieval, keyword_retrieval, merged_context, llm_call, flow_builder, result) FROM stdin;
\.


--
-- Data for Name: ai_feedback; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.ai_feedback (id, uid, user_id, execution_id, rating, comment, model, flow_id, conversation_id, "timestamp") FROM stdin;
\.


--
-- Data for Name: automation_edges; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.automation_edges (id, flow_id, edge_id, source, target, source_handle, target_handle, created_at) FROM stdin;
\.


--
-- Data for Name: automation_flow_version_metrics; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.automation_flow_version_metrics (id, version_id, conversation_count, success_rate, fallback_rate, ai_calls, average_latency, average_cost, updated_at) FROM stdin;
\.


--
-- Data for Name: automation_flow_versions; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.automation_flow_versions (id, uid, flow_id, version, status, name, flow_json, created_at, published_at, created_by, published_by, rollback_source_version, version_notes, checksum, release_tag, environment_id, revision) FROM stdin;
\.


--
-- Data for Name: automation_flows; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.automation_flows (id, uid, flow_id, name, is_published, created_at, updated_at, revision, last_saved_at, last_saved_by, locked_by, locked_at) FROM stdin;
\.


--
-- Data for Name: automation_nodes; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.automation_nodes (id, flow_id, node_id, type, position_x, position_y, data, created_at) FROM stdin;
\.


--
-- Data for Name: broadcast; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.broadcast (id, broadcast_id, uid, title, templet, phonebook, status, schedule, timezone, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: broadcast_log; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.broadcast_log (id, uid, broadcast_id, templet_name, sender_mobile, send_to, delivery_status, example, contact, meta_msg_id, delivery_time, err, created_at, updated_at, retry_count) FROM stdin;
\.


--
-- Data for Name: channel_connections; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.channel_connections (id, uid, channel_type, mode, connection_status, last_verified_at, last_error, last_heartbeat, api_version, circuit_state, failure_count, opened_at, last_failure_at, half_open_attempts, rate_limit_tokens, rate_limit_last_refill) FROM stdin;
2	tenant-uid	twilio	mock	connected	\N	\N	\N	\N	CLOSED	0	\N	\N	0	10.00	2026-06-26 03:08:48.572543+00
3	tenant-uid	email	mock	connected	\N	\N	\N	\N	CLOSED	0	\N	\N	0	10.00	2026-06-26 03:08:48.574434+00
4	tenant-uid	webchat	mock	connected	\N	\N	\N	\N	CLOSED	0	\N	\N	0	10.00	2026-06-26 03:08:48.576136+00
1	tenant-uid	whatsapp	mock	connected	\N	\N	\N	\N	OPEN	100	\N	2026-06-26 03:20:56.798659+00	0	10.00	2026-06-26 03:08:48.570066+00
\.


--
-- Data for Name: channel_credentials; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.channel_credentials (id, uid, channel_type, credentials, updated_at) FROM stdin;
\.


--
-- Data for Name: channel_dead_letter_queue; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.channel_dead_letter_queue (id, uid, channel_type, payload, attempts, last_error, provider_response, correlation_id, provider_message_id, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: channel_incoming_queue; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.channel_incoming_queue (id, uid, channel_type, payload, state, attempts, last_attempt_at, last_error, created_at, correlation_id, processing_started_at, metadata, provider_message_id) FROM stdin;
\.


--
-- Data for Name: channel_metrics; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.channel_metrics (id, uid, channel_type, messages_sent, messages_failed, avg_latency_ms, success_rate, last_outage_at, retry_count, updated_at) FROM stdin;
1	tenant-uid	whatsapp	0	100	0	0.00	\N	100	2026-06-26 03:20:56.800713+00
\.


--
-- Data for Name: channel_outgoing_queue; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.channel_outgoing_queue (id, uid, channel_type, payload, priority, state, attempts, provider_message_id, scheduled_at, expires_at, last_attempt_at, last_error, created_at, correlation_id, processing_started_at, metadata) FROM stdin;
3	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.324288+00	Adapter not found	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-ae11049cba0d	2026-06-26 03:20:56.324288+00	{}
4	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.32982+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-b2617e6a67bb	2026-06-26 03:20:56.32982+00	{}
5	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.336229+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-b4da0538060f	2026-06-26 03:20:56.336229+00	{}
7	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.347911+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-bd45e6d51183	2026-06-26 03:20:56.347911+00	{}
8	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.354817+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-c36e3b1fadd4	2026-06-26 03:20:56.354817+00	{}
9	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.360747+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-c5c4aff58ce8	2026-06-26 03:20:56.360747+00	{}
11	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.370962+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-cc5c53a28a68	2026-06-26 03:20:56.370962+00	{}
12	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.376181+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-d12df833101a	2026-06-26 03:20:56.376181+00	{}
14	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.385006+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-d99ece5c8542	2026-06-26 03:20:56.385006+00	{}
15	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.390432+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-de33cdcef271	2026-06-26 03:20:56.390432+00	{}
16	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.397987+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-e23d7a84c14f	2026-06-26 03:20:56.397987+00	{}
18	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.409952+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-e890c8a9873b	2026-06-26 03:20:56.409952+00	{}
19	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.416575+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-edb59c7f13bf	2026-06-26 03:20:56.416575+00	{}
20	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.422745+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-f1939b375eb8	2026-06-26 03:20:56.422745+00	{}
22	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.431113+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-fb4095d823fb	2026-06-26 03:20:56.431113+00	{}
23	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.436325+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-fe4d5ac74421	2026-06-26 03:20:56.436325+00	{}
24	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.441455+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-02cc9280991f	2026-06-26 03:20:56.441455+00	{}
26	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.454145+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-09d345e2a07a	2026-06-26 03:20:56.454145+00	{}
27	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.459278+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-0de59b88779f	2026-06-26 03:20:56.459278+00	{}
29	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.470271+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-15f196bf464c	2026-06-26 03:20:56.470271+00	{}
30	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.477009+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-1b55e100c40d	2026-06-26 03:20:56.477009+00	{}
31	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.482785+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-1d1a97538d39	2026-06-26 03:20:56.482785+00	{}
33	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.493962+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-27a3b367decb	2026-06-26 03:20:56.493962+00	{}
34	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.500626+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-29661a2555d1	2026-06-26 03:20:56.500626+00	{}
35	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.506832+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-2eeda387ead9	2026-06-26 03:20:56.506832+00	{}
37	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.518031+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-348edb3e808b	2026-06-26 03:20:56.518031+00	{}
38	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.522104+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-391132fb5085	2026-06-26 03:20:56.522104+00	{}
39	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.52606+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-3e21ea0effac	2026-06-26 03:20:56.52606+00	{}
41	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.53349+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-474d2dc6245d	2026-06-26 03:20:56.53349+00	{}
42	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.536913+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-49dacfc1283a	2026-06-26 03:20:56.536913+00	{}
44	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.543714+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-504946d61f2c	2026-06-26 03:20:56.543714+00	{}
45	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.548046+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-561948c0de71	2026-06-26 03:20:56.548046+00	{}
46	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.553154+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-59b95a1acf10	2026-06-26 03:20:56.553154+00	{}
48	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.564169+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-631819cd95a2	2026-06-26 03:20:56.564169+00	{}
49	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.569079+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-6712d3573688	2026-06-26 03:20:56.569079+00	{}
50	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.575005+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-69136519ed9e	2026-06-26 03:20:56.575005+00	{}
52	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.584308+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-7041004cf17a	2026-06-26 03:20:56.584308+00	{}
53	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.587949+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-7667e4405532	2026-06-26 03:20:56.587949+00	{}
54	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.591316+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-792be0cccd1f	2026-06-26 03:20:56.591316+00	{}
56	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.603398+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-83f36e2b3618	2026-06-26 03:20:56.603398+00	{}
57	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.610161+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-84daafc21d64	2026-06-26 03:20:56.610161+00	{}
101	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-bc66af0f8088	\N	{}
102	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-c22c0aa19328	\N	{}
103	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-c432c04004ea	\N	{}
104	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-c8320bc5a012	\N	{}
105	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-ce578567c1de	\N	{}
106	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-d2af630dbbee	\N	{}
107	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-d7cb57f3a69c	\N	{}
108	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-da4ad2b92c82	\N	{}
109	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-df1eaafb261f	\N	{}
110	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-e1382f46f37a	\N	{}
111	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-e4d0071b6e83	\N	{}
112	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-ea8834a441fd	\N	{}
113	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-ee230df24d4a	\N	{}
114	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-f1c8df0a62f3	\N	{}
115	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-f64cda46f649	\N	{}
116	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-fb5493c641b0	\N	{}
61	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.629909+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-964cdb9e175e	2026-06-26 03:20:56.629909+00	{}
62	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.634877+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-9b537cba13fb	2026-06-26 03:20:56.634877+00	{}
63	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.638875+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-9d4b9a0206d8	2026-06-26 03:20:56.638875+00	{}
65	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.648179+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-a70fb6528e45	2026-06-26 03:20:56.648179+00	{}
66	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.653755+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-ab6a2fdce4d6	2026-06-26 03:20:56.653755+00	{}
67	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.658724+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-ac0a0a8cbf2d	2026-06-26 03:20:56.658724+00	{}
69	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.666558+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-b5ec34f3f4c8	2026-06-26 03:20:56.666558+00	{}
70	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.670441+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-b833623d64c3	2026-06-26 03:20:56.670441+00	{}
72	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.679444+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-c19fa7451d27	2026-06-26 03:20:56.679444+00	{}
73	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.683613+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-c6a214195238	2026-06-26 03:20:56.683613+00	{}
74	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.687488+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-ca529d745a69	2026-06-26 03:20:56.687488+00	{}
76	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.694776+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-d316b566dc8b	2026-06-26 03:20:56.694776+00	{}
77	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.698248+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-d7fd9b1bfe7a	2026-06-26 03:20:56.698248+00	{}
78	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.701915+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-d8b46e424362	2026-06-26 03:20:56.701915+00	{}
80	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.710565+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-e133e30d9b03	2026-06-26 03:20:56.710565+00	{}
81	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.71499+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-e61d95b39ae2	2026-06-26 03:20:56.71499+00	{}
82	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.719387+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-eb90e9e3e0cb	2026-06-26 03:20:56.719387+00	{}
84	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.728447+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-f3291173f1ab	2026-06-26 03:20:56.728447+00	{}
85	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.734564+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-f69e49dcd313	2026-06-26 03:20:56.734564+00	{}
87	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.743329+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-fc97c7076203	2026-06-26 03:20:56.743329+00	{}
88	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.747085+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-004df1093dcd	2026-06-26 03:20:56.747085+00	{}
89	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.750676+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-0666ad3a54b4	2026-06-26 03:20:56.750676+00	{}
91	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.759049+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-0d7fc3439047	2026-06-26 03:20:56.759049+00	{}
92	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.763694+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-1206c7a3aa29	2026-06-26 03:20:56.763694+00	{}
93	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.767413+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-16d568f5ac37	2026-06-26 03:20:56.767413+00	{}
95	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.776454+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-1d760fe5add1	2026-06-26 03:20:56.776454+00	{}
96	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.780907+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-23c3ba3fea92	2026-06-26 03:20:56.780907+00	{}
97	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.7853+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-26043a54a862	2026-06-26 03:20:56.7853+00	{}
99	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.793104+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-2df19d462f78	2026-06-26 03:20:56.793104+00	{}
100	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.797364+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-3124a5be30d9	2026-06-26 03:20:56.797364+00	{}
117	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3ae-fd1e0ed4da0f	\N	{}
118	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-00972ca96718	\N	{}
119	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-06db1c6e5605	\N	{}
120	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-09e97d5720f2	\N	{}
121	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-0c94e613ee1f	\N	{}
122	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-12dd3ecdce85	\N	{}
123	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-163c83d55b3b	\N	{}
124	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-1a0434eb14e8	\N	{}
125	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-1f90f2b0fe07	\N	{}
126	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-22b34782cc25	\N	{}
127	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-263e439cc396	\N	{}
128	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-2b0caffbb4ee	\N	{}
129	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-2ceb6535c4cb	\N	{}
130	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-30f9e7232d51	\N	{}
131	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-35e8ec86897a	\N	{}
132	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-397f10c73bf0	\N	{}
133	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-3d5696455f24	\N	{}
134	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-42fd9dcbd4b1	\N	{}
135	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-450d864fcab5	\N	{}
136	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-4a2621a3d273	\N	{}
137	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-4d5450a199f0	\N	{}
138	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-533f898cf063	\N	{}
139	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-54ebca64c74e	\N	{}
140	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-581c0faab750	\N	{}
141	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-5d8f5ee7eba0	\N	{}
142	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-63948436027a	\N	{}
143	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-65f1d72f8112	\N	{}
144	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-6bae85763be3	\N	{}
145	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-6fa4587f922e	\N	{}
146	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-739f7aa24af0	\N	{}
147	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-76a6bed42532	\N	{}
148	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-7bc9dcb2eab8	\N	{}
149	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-7d7dc284bab6	\N	{}
150	tenant-uid	whatsapp	{"to": "915555500001"}	0	retry	2	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-809d352685ec	\N	{}
151	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-84d6fba2669d	\N	{}
152	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-8a22cbae0ce9	\N	{}
153	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-8d696b610cbf	\N	{}
154	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-903bc0d33c8d	\N	{}
155	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-9611a2c252a0	\N	{}
156	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-98442fd9f2f9	\N	{}
157	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-9df912b5ac27	\N	{}
158	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-a30a66143863	\N	{}
159	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-a47f0b1e23f5	\N	{}
160	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-abb58994ec2e	\N	{}
161	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-ae3842d45c64	\N	{}
162	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-b0caad757c31	\N	{}
163	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-b5ee9b9e34c9	\N	{}
164	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-b88fd8e11146	\N	{}
165	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-bf843813fc28	\N	{}
166	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-c0bc6cdfe3ed	\N	{}
167	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-c56c61766277	\N	{}
168	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-ca2a881881a3	\N	{}
169	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-cd17c31075b1	\N	{}
170	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-d33ca679a015	\N	{}
171	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-d522d739a926	\N	{}
172	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-d8495925201c	\N	{}
173	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-dd3f37170fc3	\N	{}
174	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-e15e0a16c225	\N	{}
175	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-e58352abfcc3	\N	{}
176	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-e998cab48635	\N	{}
177	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-ec42310146be	\N	{}
178	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-f26cacc2c05e	\N	{}
179	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-f6099b3ad084	\N	{}
180	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-f820a1bc87b5	\N	{}
181	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3af-fefe401410d7	\N	{}
182	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-01509cfb2626	\N	{}
183	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-04f74cb49b10	\N	{}
184	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-0b0fb14deb83	\N	{}
185	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-0e1f6f9a2e75	\N	{}
186	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-11b50df57fab	\N	{}
187	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-15ac3223ab91	\N	{}
188	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-1b34243b8381	\N	{}
189	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-1faf16ba506c	\N	{}
190	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-20b0d4164efb	\N	{}
191	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-25ba3b458e14	\N	{}
192	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-28f3d884e337	\N	{}
193	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-2fc35ce6fb8f	\N	{}
194	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-332f32957e84	\N	{}
195	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-36f5a9dc9f19	\N	{}
196	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-3923fd473062	\N	{}
197	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-3ec4067b43c3	\N	{}
198	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-433668094e8f	\N	{}
199	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-44198882a26a	\N	{}
200	tenant-uid	whatsapp	{"to": "915555500001"}	0	failed	5	\N	\N	\N	\N	\N	2026-06-26 03:17:33.471857+00	019f01ee-c69f-70d8-a3b0-4b6045869839	\N	{}
1	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.310399+00	Adapter not found	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-a51c97d687aa	2026-06-26 03:20:56.310399+00	{}
2	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.318001+00	Adapter not found	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-abca880b76d1	2026-06-26 03:20:56.318001+00	{}
6	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.341271+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-bb6bdefb9563	2026-06-26 03:20:56.341271+00	{}
10	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.366009+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-ca4a641dab73	2026-06-26 03:20:56.366009+00	{}
13	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.380795+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-d6d6209ab844	2026-06-26 03:20:56.380795+00	{}
17	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.404203+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-e7c3e96b6c55	2026-06-26 03:20:56.404203+00	{}
21	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.426816+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d6-f52c17933120	2026-06-26 03:20:56.426816+00	{}
25	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.448485+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-07982533a686	2026-06-26 03:20:56.448485+00	{}
28	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.463952+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-124e4b9f4c4c	2026-06-26 03:20:56.463952+00	{}
32	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.487185+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-224145bb9b18	2026-06-26 03:20:56.487185+00	{}
36	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.513228+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-3278fa899d61	2026-06-26 03:20:56.513228+00	{}
40	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.529817+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-40a4d7ae729a	2026-06-26 03:20:56.529817+00	{}
43	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.540421+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-4f8a56ff1d2d	2026-06-26 03:20:56.540421+00	{}
47	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.558114+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-5fc553589705	2026-06-26 03:20:56.558114+00	{}
51	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.579186+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-6c4fc1bf704b	2026-06-26 03:20:56.579186+00	{}
55	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.597782+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-7c568ff177ed	2026-06-26 03:20:56.597782+00	{}
58	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.615777+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-895d5f0bdca8	2026-06-26 03:20:56.615777+00	{}
59	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.621216+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-8d6151785402	2026-06-26 03:20:56.621216+00	{}
60	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.625492+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-92b0dc8b649d	2026-06-26 03:20:56.625492+00	{}
64	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.643184+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-a05148e23c5c	2026-06-26 03:20:56.643184+00	{}
68	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.662847+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-b38947355eaf	2026-06-26 03:20:56.662847+00	{}
71	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.675095+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-bdf0e1f2b6e3	2026-06-26 03:20:56.675095+00	{}
75	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.691161+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-cc7ec3811467	2026-06-26 03:20:56.691161+00	{}
79	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.706414+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-ddbab21b0771	2026-06-26 03:20:56.706414+00	{}
83	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.724152+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-edd0e134a2a7	2026-06-26 03:20:56.724152+00	{}
86	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.739449+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d7-f8dc9f6099d3	2026-06-26 03:20:56.739449+00	{}
90	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.755192+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-084a1589f50e	2026-06-26 03:20:56.755192+00	{}
94	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.770738+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-184dd4a9ced7	2026-06-26 03:20:56.770738+00	{}
98	tenant-uid	whatsapp	{"to": "915555500001"}	0	retrying	1	\N	\N	\N	2026-06-26 03:20:56.789213+00	Circuit breaker OPEN	2026-06-26 03:17:33.467768+00	019f01ee-c69b-7631-89d8-2a3340402819	2026-06-26 03:20:56.789213+00	{}
\.


--
-- Data for Name: channel_settings; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.channel_settings (id, uid, channel_type, settings, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_tags; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.chat_tags (id, uid, hex, title, createdat) FROM stdin;
\.


--
-- Data for Name: chat_widget; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.chat_widget (id, unique_id, uid, title, whatsapp_number, logo, place, size, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: chatbot; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.chatbot (id, uid, title, for_all, chats, flow, flow_id, active, origin, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: chatbot_log; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.chatbot_log (id, uid, chatbot_id, chatbot_title, flow_id, sender_number, sender_name, incoming_message, origin, matched, status, detail, created_at) FROM stdin;
\.


--
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.chats (id, chat_id, uid, last_message_came, sender_name, sender_mobile, last_message, is_opened, chat_status, chat_note, chat_tags, origin, profile, other, createdat, updatedat, assigned_agent_uid, last_reply_by, last_incoming_time, last_outgoing_time, sla_expires_at, sla_violated, kanban_order) FROM stdin;
2	917777777701	tenant-uid	1782443580722	Contact 1	917777777701	Hello from SAT	0	open	\N	SAT	META	\N	\N	2026-06-26 03:13:00.723378+00	2026-06-26 03:13:00.723378+00	agent-1-uid	\N	\N	\N	\N	0	0
3	917777777702	tenant-uid	1782443580725	Contact 2	917777777702	Hello from SAT	0	open	\N	SAT	META	\N	\N	2026-06-26 03:13:00.726105+00	2026-06-26 03:13:00.726105+00	agent-1-uid	\N	\N	\N	\N	0	0
4	917777777703	tenant-uid	1782443580727	Contact 3	917777777703	Hello from SAT	0	open	\N	SAT	META	\N	\N	2026-06-26 03:13:00.727706+00	2026-06-26 03:13:00.727706+00	agent-1-uid	\N	\N	\N	\N	0	0
5	917777777704	tenant-uid	1782443580729	Contact 4	917777777704	Hello from SAT	0	open	\N	SAT	META	\N	\N	2026-06-26 03:13:00.72918+00	2026-06-26 03:13:00.72918+00	agent-1-uid	\N	\N	\N	\N	0	0
6	917777777705	tenant-uid	1782443580730	Contact 5	917777777705	Hello from SAT	0	open	\N	SAT	META	\N	\N	2026-06-26 03:13:00.730656+00	2026-06-26 03:13:00.730656+00	agent-1-uid	\N	\N	\N	\N	0	0
7	917777777706	tenant-uid	1782443580732	Contact 6	917777777706	Hello from SAT	0	open	\N	SAT	META	\N	\N	2026-06-26 03:13:00.732195+00	2026-06-26 03:13:00.732195+00	agent-1-uid	\N	\N	\N	\N	0	0
8	917777777707	tenant-uid	1782443580733	Contact 7	917777777707	Hello from SAT	0	open	\N	SAT	META	\N	\N	2026-06-26 03:13:00.733681+00	2026-06-26 03:13:00.733681+00	agent-1-uid	\N	\N	\N	\N	0	0
9	917777777708	tenant-uid	1782443580734	Contact 8	917777777708	Hello from SAT	0	open	\N	SAT	META	\N	\N	2026-06-26 03:13:00.735068+00	2026-06-26 03:13:00.735068+00	agent-1-uid	\N	\N	\N	\N	0	0
10	917777777709	tenant-uid	1782443580736	Contact 9	917777777709	Hello from SAT	0	open	\N	SAT	META	\N	\N	2026-06-26 03:13:00.736241+00	2026-06-26 03:13:00.736241+00	agent-1-uid	\N	\N	\N	\N	0	0
11	917777777710	tenant-uid	1782443580737	Contact 10	917777777710	Hello from SAT	0	open	\N	SAT	META	\N	\N	2026-06-26 03:13:00.737522+00	2026-06-26 03:13:00.737522+00	agent-1-uid	\N	\N	\N	\N	0	0
12	915555500011	tenant-uid	1782443830853	Load Contact 11	915555500011	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
13	915555500012	tenant-uid	1782443830853	Load Contact 12	915555500012	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
14	915555500013	tenant-uid	1782443830854	Load Contact 13	915555500013	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
15	915555500014	tenant-uid	1782443830854	Load Contact 14	915555500014	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
16	915555500015	tenant-uid	1782443830854	Load Contact 15	915555500015	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
17	915555500016	tenant-uid	1782443830854	Load Contact 16	915555500016	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
18	915555500017	tenant-uid	1782443830854	Load Contact 17	915555500017	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
19	915555500018	tenant-uid	1782443830854	Load Contact 18	915555500018	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
20	915555500019	tenant-uid	1782443830854	Load Contact 19	915555500019	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
21	915555500020	tenant-uid	1782443830854	Load Contact 20	915555500020	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
22	915555500021	tenant-uid	1782443830854	Load Contact 21	915555500021	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
23	915555500022	tenant-uid	1782443830854	Load Contact 22	915555500022	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
24	915555500023	tenant-uid	1782443830854	Load Contact 23	915555500023	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
25	915555500024	tenant-uid	1782443830854	Load Contact 24	915555500024	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
26	915555500025	tenant-uid	1782443830854	Load Contact 25	915555500025	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
27	915555500026	tenant-uid	1782443830854	Load Contact 26	915555500026	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
28	915555500027	tenant-uid	1782443830854	Load Contact 27	915555500027	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
29	915555500028	tenant-uid	1782443830854	Load Contact 28	915555500028	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
30	915555500029	tenant-uid	1782443830855	Load Contact 29	915555500029	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
31	915555500030	tenant-uid	1782443830855	Load Contact 30	915555500030	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
32	915555500031	tenant-uid	1782443830855	Load Contact 31	915555500031	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
33	915555500032	tenant-uid	1782443830855	Load Contact 32	915555500032	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
34	915555500033	tenant-uid	1782443830855	Load Contact 33	915555500033	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
35	915555500034	tenant-uid	1782443830855	Load Contact 34	915555500034	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
36	915555500035	tenant-uid	1782443830855	Load Contact 35	915555500035	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
37	915555500036	tenant-uid	1782443830855	Load Contact 36	915555500036	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
38	915555500037	tenant-uid	1782443830855	Load Contact 37	915555500037	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
39	915555500038	tenant-uid	1782443830855	Load Contact 38	915555500038	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
40	915555500039	tenant-uid	1782443830855	Load Contact 39	915555500039	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
41	915555500040	tenant-uid	1782443830855	Load Contact 40	915555500040	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
42	915555500041	tenant-uid	1782443830855	Load Contact 41	915555500041	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
43	915555500042	tenant-uid	1782443830855	Load Contact 42	915555500042	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
44	915555500043	tenant-uid	1782443830855	Load Contact 43	915555500043	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
45	915555500044	tenant-uid	1782443830855	Load Contact 44	915555500044	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
46	915555500045	tenant-uid	1782443830855	Load Contact 45	915555500045	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
47	915555500046	tenant-uid	1782443830855	Load Contact 46	915555500046	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
48	915555500047	tenant-uid	1782443830855	Load Contact 47	915555500047	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
49	915555500048	tenant-uid	1782443830855	Load Contact 48	915555500048	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
50	915555500049	tenant-uid	1782443830855	Load Contact 49	915555500049	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
51	915555500050	tenant-uid	1782443830856	Load Contact 50	915555500050	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
52	915555500051	tenant-uid	1782443830856	Load Contact 51	915555500051	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
53	915555500052	tenant-uid	1782443830856	Load Contact 52	915555500052	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
54	915555500053	tenant-uid	1782443830856	Load Contact 53	915555500053	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
55	915555500054	tenant-uid	1782443830856	Load Contact 54	915555500054	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
56	915555500055	tenant-uid	1782443830856	Load Contact 55	915555500055	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
57	915555500056	tenant-uid	1782443830856	Load Contact 56	915555500056	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
58	915555500057	tenant-uid	1782443830856	Load Contact 57	915555500057	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
59	915555500058	tenant-uid	1782443830856	Load Contact 58	915555500058	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
60	915555500059	tenant-uid	1782443830856	Load Contact 59	915555500059	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
61	915555500060	tenant-uid	1782443830856	Load Contact 60	915555500060	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
62	915555500061	tenant-uid	1782443830856	Load Contact 61	915555500061	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
63	915555500062	tenant-uid	1782443830856	Load Contact 62	915555500062	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
64	915555500063	tenant-uid	1782443830856	Load Contact 63	915555500063	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
65	915555500064	tenant-uid	1782443830856	Load Contact 64	915555500064	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
66	915555500065	tenant-uid	1782443830856	Load Contact 65	915555500065	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
67	915555500066	tenant-uid	1782443830856	Load Contact 66	915555500066	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
68	915555500067	tenant-uid	1782443830857	Load Contact 67	915555500067	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
69	915555500068	tenant-uid	1782443830857	Load Contact 68	915555500068	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
70	915555500069	tenant-uid	1782443830857	Load Contact 69	915555500069	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
71	915555500070	tenant-uid	1782443830857	Load Contact 70	915555500070	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
72	915555500071	tenant-uid	1782443830857	Load Contact 71	915555500071	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
73	915555500072	tenant-uid	1782443830857	Load Contact 72	915555500072	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
74	915555500073	tenant-uid	1782443830857	Load Contact 73	915555500073	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
75	915555500074	tenant-uid	1782443830857	Load Contact 74	915555500074	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
76	915555500075	tenant-uid	1782443830857	Load Contact 75	915555500075	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
77	915555500076	tenant-uid	1782443830857	Load Contact 76	915555500076	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
78	915555500077	tenant-uid	1782443830857	Load Contact 77	915555500077	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
79	915555500078	tenant-uid	1782443830857	Load Contact 78	915555500078	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
80	915555500079	tenant-uid	1782443830857	Load Contact 79	915555500079	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
81	915555500080	tenant-uid	1782443830857	Load Contact 80	915555500080	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
82	915555500081	tenant-uid	1782443830857	Load Contact 81	915555500081	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
83	915555500082	tenant-uid	1782443830857	Load Contact 82	915555500082	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
84	915555500083	tenant-uid	1782443830857	Load Contact 83	915555500083	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
85	915555500084	tenant-uid	1782443830857	Load Contact 84	915555500084	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
86	915555500085	tenant-uid	1782443830857	Load Contact 85	915555500085	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
87	915555500086	tenant-uid	1782443830857	Load Contact 86	915555500086	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
88	915555500087	tenant-uid	1782443830857	Load Contact 87	915555500087	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
89	915555500088	tenant-uid	1782443830857	Load Contact 88	915555500088	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
90	915555500089	tenant-uid	1782443830857	Load Contact 89	915555500089	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
91	915555500090	tenant-uid	1782443830858	Load Contact 90	915555500090	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
92	915555500091	tenant-uid	1782443830858	Load Contact 91	915555500091	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
93	915555500092	tenant-uid	1782443830858	Load Contact 92	915555500092	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
94	915555500093	tenant-uid	1782443830858	Load Contact 93	915555500093	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
95	915555500094	tenant-uid	1782443830858	Load Contact 94	915555500094	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
96	915555500095	tenant-uid	1782443830858	Load Contact 95	915555500095	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
97	915555500096	tenant-uid	1782443830858	Load Contact 96	915555500096	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
98	915555500097	tenant-uid	1782443830858	Load Contact 97	915555500097	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
99	915555500098	tenant-uid	1782443830858	Load Contact 98	915555500098	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
100	915555500099	tenant-uid	1782443830858	Load Contact 99	915555500099	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
101	915555500100	tenant-uid	1782443830858	Load Contact 100	915555500100	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.858939+00	2026-06-26 03:17:10.858939+00	agent-1-uid	\N	\N	\N	\N	0	0
102	915555500101	tenant-uid	1782443830862	Load Contact 101	915555500101	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
103	915555500102	tenant-uid	1782443830862	Load Contact 102	915555500102	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
104	915555500103	tenant-uid	1782443830862	Load Contact 103	915555500103	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
105	915555500104	tenant-uid	1782443830862	Load Contact 104	915555500104	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
106	915555500105	tenant-uid	1782443830862	Load Contact 105	915555500105	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
107	915555500106	tenant-uid	1782443830862	Load Contact 106	915555500106	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
108	915555500107	tenant-uid	1782443830862	Load Contact 107	915555500107	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
109	915555500108	tenant-uid	1782443830862	Load Contact 108	915555500108	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
110	915555500109	tenant-uid	1782443830862	Load Contact 109	915555500109	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
111	915555500110	tenant-uid	1782443830862	Load Contact 110	915555500110	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
112	915555500111	tenant-uid	1782443830862	Load Contact 111	915555500111	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
113	915555500112	tenant-uid	1782443830862	Load Contact 112	915555500112	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
114	915555500113	tenant-uid	1782443830862	Load Contact 113	915555500113	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
115	915555500114	tenant-uid	1782443830862	Load Contact 114	915555500114	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
116	915555500115	tenant-uid	1782443830862	Load Contact 115	915555500115	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
117	915555500116	tenant-uid	1782443830862	Load Contact 116	915555500116	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
118	915555500117	tenant-uid	1782443830862	Load Contact 117	915555500117	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
119	915555500118	tenant-uid	1782443830862	Load Contact 118	915555500118	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
120	915555500119	tenant-uid	1782443830862	Load Contact 119	915555500119	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
121	915555500120	tenant-uid	1782443830862	Load Contact 120	915555500120	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
122	915555500121	tenant-uid	1782443830863	Load Contact 121	915555500121	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
123	915555500122	tenant-uid	1782443830863	Load Contact 122	915555500122	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
124	915555500123	tenant-uid	1782443830863	Load Contact 123	915555500123	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
125	915555500124	tenant-uid	1782443830863	Load Contact 124	915555500124	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
126	915555500125	tenant-uid	1782443830863	Load Contact 125	915555500125	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
127	915555500126	tenant-uid	1782443830863	Load Contact 126	915555500126	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
128	915555500127	tenant-uid	1782443830863	Load Contact 127	915555500127	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
129	915555500128	tenant-uid	1782443830863	Load Contact 128	915555500128	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
130	915555500129	tenant-uid	1782443830863	Load Contact 129	915555500129	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
131	915555500130	tenant-uid	1782443830863	Load Contact 130	915555500130	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
132	915555500131	tenant-uid	1782443830863	Load Contact 131	915555500131	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
133	915555500132	tenant-uid	1782443830863	Load Contact 132	915555500132	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
134	915555500133	tenant-uid	1782443830863	Load Contact 133	915555500133	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
135	915555500134	tenant-uid	1782443830863	Load Contact 134	915555500134	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
136	915555500135	tenant-uid	1782443830863	Load Contact 135	915555500135	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
137	915555500136	tenant-uid	1782443830863	Load Contact 136	915555500136	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
138	915555500137	tenant-uid	1782443830863	Load Contact 137	915555500137	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
139	915555500138	tenant-uid	1782443830863	Load Contact 138	915555500138	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
140	915555500139	tenant-uid	1782443830863	Load Contact 139	915555500139	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
141	915555500140	tenant-uid	1782443830863	Load Contact 140	915555500140	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
142	915555500141	tenant-uid	1782443830863	Load Contact 141	915555500141	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
143	915555500142	tenant-uid	1782443830863	Load Contact 142	915555500142	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
144	915555500143	tenant-uid	1782443830863	Load Contact 143	915555500143	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
145	915555500144	tenant-uid	1782443830863	Load Contact 144	915555500144	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
146	915555500145	tenant-uid	1782443830863	Load Contact 145	915555500145	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
147	915555500146	tenant-uid	1782443830863	Load Contact 146	915555500146	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
148	915555500147	tenant-uid	1782443830863	Load Contact 147	915555500147	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
149	915555500148	tenant-uid	1782443830864	Load Contact 148	915555500148	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
150	915555500149	tenant-uid	1782443830864	Load Contact 149	915555500149	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
151	915555500150	tenant-uid	1782443830864	Load Contact 150	915555500150	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
152	915555500151	tenant-uid	1782443830864	Load Contact 151	915555500151	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
153	915555500152	tenant-uid	1782443830864	Load Contact 152	915555500152	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
154	915555500153	tenant-uid	1782443830864	Load Contact 153	915555500153	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
155	915555500154	tenant-uid	1782443830864	Load Contact 154	915555500154	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
156	915555500155	tenant-uid	1782443830864	Load Contact 155	915555500155	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
157	915555500156	tenant-uid	1782443830864	Load Contact 156	915555500156	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
158	915555500157	tenant-uid	1782443830864	Load Contact 157	915555500157	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
159	915555500158	tenant-uid	1782443830864	Load Contact 158	915555500158	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
160	915555500159	tenant-uid	1782443830864	Load Contact 159	915555500159	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
161	915555500160	tenant-uid	1782443830864	Load Contact 160	915555500160	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
162	915555500161	tenant-uid	1782443830864	Load Contact 161	915555500161	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
163	915555500162	tenant-uid	1782443830864	Load Contact 162	915555500162	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
164	915555500163	tenant-uid	1782443830864	Load Contact 163	915555500163	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
165	915555500164	tenant-uid	1782443830864	Load Contact 164	915555500164	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
166	915555500165	tenant-uid	1782443830864	Load Contact 165	915555500165	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
167	915555500166	tenant-uid	1782443830864	Load Contact 166	915555500166	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
168	915555500167	tenant-uid	1782443830864	Load Contact 167	915555500167	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
169	915555500168	tenant-uid	1782443830864	Load Contact 168	915555500168	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
170	915555500169	tenant-uid	1782443830864	Load Contact 169	915555500169	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
171	915555500170	tenant-uid	1782443830864	Load Contact 170	915555500170	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
172	915555500171	tenant-uid	1782443830864	Load Contact 171	915555500171	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
173	915555500172	tenant-uid	1782443830864	Load Contact 172	915555500172	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
174	915555500173	tenant-uid	1782443830864	Load Contact 173	915555500173	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
175	915555500174	tenant-uid	1782443830864	Load Contact 174	915555500174	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
176	915555500175	tenant-uid	1782443830865	Load Contact 175	915555500175	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
177	915555500176	tenant-uid	1782443830865	Load Contact 176	915555500176	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
178	915555500177	tenant-uid	1782443830865	Load Contact 177	915555500177	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
179	915555500178	tenant-uid	1782443830865	Load Contact 178	915555500178	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
180	915555500179	tenant-uid	1782443830865	Load Contact 179	915555500179	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
181	915555500180	tenant-uid	1782443830865	Load Contact 180	915555500180	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
182	915555500181	tenant-uid	1782443830865	Load Contact 181	915555500181	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
183	915555500182	tenant-uid	1782443830865	Load Contact 182	915555500182	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
184	915555500183	tenant-uid	1782443830865	Load Contact 183	915555500183	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
185	915555500184	tenant-uid	1782443830865	Load Contact 184	915555500184	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
186	915555500185	tenant-uid	1782443830865	Load Contact 185	915555500185	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
187	915555500186	tenant-uid	1782443830865	Load Contact 186	915555500186	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
188	915555500187	tenant-uid	1782443830865	Load Contact 187	915555500187	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
189	915555500188	tenant-uid	1782443830865	Load Contact 188	915555500188	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
190	915555500189	tenant-uid	1782443830865	Load Contact 189	915555500189	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
191	915555500190	tenant-uid	1782443830865	Load Contact 190	915555500190	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
192	915555500191	tenant-uid	1782443830865	Load Contact 191	915555500191	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
193	915555500192	tenant-uid	1782443830865	Load Contact 192	915555500192	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
194	915555500193	tenant-uid	1782443830865	Load Contact 193	915555500193	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
195	915555500194	tenant-uid	1782443830865	Load Contact 194	915555500194	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
196	915555500195	tenant-uid	1782443830865	Load Contact 195	915555500195	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
197	915555500196	tenant-uid	1782443830865	Load Contact 196	915555500196	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
198	915555500197	tenant-uid	1782443830866	Load Contact 197	915555500197	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
199	915555500198	tenant-uid	1782443830866	Load Contact 198	915555500198	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
200	915555500199	tenant-uid	1782443830866	Load Contact 199	915555500199	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
201	915555500200	tenant-uid	1782443830866	Load Contact 200	915555500200	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.866455+00	2026-06-26 03:17:10.866455+00	agent-1-uid	\N	\N	\N	\N	0	0
202	915555500201	tenant-uid	1782443830869	Load Contact 201	915555500201	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
203	915555500202	tenant-uid	1782443830869	Load Contact 202	915555500202	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
204	915555500203	tenant-uid	1782443830869	Load Contact 203	915555500203	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
205	915555500204	tenant-uid	1782443830869	Load Contact 204	915555500204	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
206	915555500205	tenant-uid	1782443830869	Load Contact 205	915555500205	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
207	915555500206	tenant-uid	1782443830869	Load Contact 206	915555500206	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
208	915555500207	tenant-uid	1782443830869	Load Contact 207	915555500207	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
209	915555500208	tenant-uid	1782443830869	Load Contact 208	915555500208	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
210	915555500209	tenant-uid	1782443830869	Load Contact 209	915555500209	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
211	915555500210	tenant-uid	1782443830869	Load Contact 210	915555500210	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
212	915555500211	tenant-uid	1782443830869	Load Contact 211	915555500211	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
213	915555500212	tenant-uid	1782443830869	Load Contact 212	915555500212	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
214	915555500213	tenant-uid	1782443830869	Load Contact 213	915555500213	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
215	915555500214	tenant-uid	1782443830869	Load Contact 214	915555500214	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
216	915555500215	tenant-uid	1782443830869	Load Contact 215	915555500215	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
217	915555500216	tenant-uid	1782443830870	Load Contact 216	915555500216	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
218	915555500217	tenant-uid	1782443830870	Load Contact 217	915555500217	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
219	915555500218	tenant-uid	1782443830870	Load Contact 218	915555500218	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
220	915555500219	tenant-uid	1782443830870	Load Contact 219	915555500219	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
221	915555500220	tenant-uid	1782443830870	Load Contact 220	915555500220	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
222	915555500221	tenant-uid	1782443830870	Load Contact 221	915555500221	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
223	915555500222	tenant-uid	1782443830870	Load Contact 222	915555500222	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
224	915555500223	tenant-uid	1782443830870	Load Contact 223	915555500223	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
225	915555500224	tenant-uid	1782443830870	Load Contact 224	915555500224	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
226	915555500225	tenant-uid	1782443830870	Load Contact 225	915555500225	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
227	915555500226	tenant-uid	1782443830870	Load Contact 226	915555500226	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
228	915555500227	tenant-uid	1782443830870	Load Contact 227	915555500227	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
229	915555500228	tenant-uid	1782443830870	Load Contact 228	915555500228	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
230	915555500229	tenant-uid	1782443830870	Load Contact 229	915555500229	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
231	915555500230	tenant-uid	1782443830870	Load Contact 230	915555500230	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
232	915555500231	tenant-uid	1782443830870	Load Contact 231	915555500231	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
233	915555500232	tenant-uid	1782443830870	Load Contact 232	915555500232	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
234	915555500233	tenant-uid	1782443830870	Load Contact 233	915555500233	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
235	915555500234	tenant-uid	1782443830870	Load Contact 234	915555500234	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
236	915555500235	tenant-uid	1782443830870	Load Contact 235	915555500235	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
237	915555500236	tenant-uid	1782443830870	Load Contact 236	915555500236	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
238	915555500237	tenant-uid	1782443830870	Load Contact 237	915555500237	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
239	915555500238	tenant-uid	1782443830870	Load Contact 238	915555500238	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
240	915555500239	tenant-uid	1782443830870	Load Contact 239	915555500239	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
241	915555500240	tenant-uid	1782443830870	Load Contact 240	915555500240	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
242	915555500241	tenant-uid	1782443830870	Load Contact 241	915555500241	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
243	915555500242	tenant-uid	1782443830871	Load Contact 242	915555500242	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
244	915555500243	tenant-uid	1782443830871	Load Contact 243	915555500243	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
245	915555500244	tenant-uid	1782443830871	Load Contact 244	915555500244	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
246	915555500245	tenant-uid	1782443830871	Load Contact 245	915555500245	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
247	915555500246	tenant-uid	1782443830871	Load Contact 246	915555500246	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
248	915555500247	tenant-uid	1782443830871	Load Contact 247	915555500247	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
249	915555500248	tenant-uid	1782443830871	Load Contact 248	915555500248	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
250	915555500249	tenant-uid	1782443830871	Load Contact 249	915555500249	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
251	915555500250	tenant-uid	1782443830871	Load Contact 250	915555500250	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
252	915555500251	tenant-uid	1782443830871	Load Contact 251	915555500251	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
253	915555500252	tenant-uid	1782443830871	Load Contact 252	915555500252	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
254	915555500253	tenant-uid	1782443830871	Load Contact 253	915555500253	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
255	915555500254	tenant-uid	1782443830871	Load Contact 254	915555500254	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
256	915555500255	tenant-uid	1782443830871	Load Contact 255	915555500255	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
257	915555500256	tenant-uid	1782443830871	Load Contact 256	915555500256	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
258	915555500257	tenant-uid	1782443830871	Load Contact 257	915555500257	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
259	915555500258	tenant-uid	1782443830871	Load Contact 258	915555500258	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
260	915555500259	tenant-uid	1782443830871	Load Contact 259	915555500259	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
261	915555500260	tenant-uid	1782443830871	Load Contact 260	915555500260	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
262	915555500261	tenant-uid	1782443830871	Load Contact 261	915555500261	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
263	915555500262	tenant-uid	1782443830871	Load Contact 262	915555500262	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
264	915555500263	tenant-uid	1782443830871	Load Contact 263	915555500263	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
265	915555500264	tenant-uid	1782443830871	Load Contact 264	915555500264	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
266	915555500265	tenant-uid	1782443830871	Load Contact 265	915555500265	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
267	915555500266	tenant-uid	1782443830871	Load Contact 266	915555500266	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
268	915555500267	tenant-uid	1782443830871	Load Contact 267	915555500267	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
269	915555500268	tenant-uid	1782443830871	Load Contact 268	915555500268	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
270	915555500269	tenant-uid	1782443830871	Load Contact 269	915555500269	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
271	915555500270	tenant-uid	1782443830872	Load Contact 270	915555500270	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
272	915555500271	tenant-uid	1782443830872	Load Contact 271	915555500271	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
273	915555500272	tenant-uid	1782443830872	Load Contact 272	915555500272	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
274	915555500273	tenant-uid	1782443830872	Load Contact 273	915555500273	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
275	915555500274	tenant-uid	1782443830872	Load Contact 274	915555500274	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
276	915555500275	tenant-uid	1782443830872	Load Contact 275	915555500275	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
277	915555500276	tenant-uid	1782443830872	Load Contact 276	915555500276	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
278	915555500277	tenant-uid	1782443830872	Load Contact 277	915555500277	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
279	915555500278	tenant-uid	1782443830872	Load Contact 278	915555500278	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
280	915555500279	tenant-uid	1782443830872	Load Contact 279	915555500279	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
281	915555500280	tenant-uid	1782443830872	Load Contact 280	915555500280	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
282	915555500281	tenant-uid	1782443830872	Load Contact 281	915555500281	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
283	915555500282	tenant-uid	1782443830872	Load Contact 282	915555500282	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
284	915555500283	tenant-uid	1782443830872	Load Contact 283	915555500283	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
285	915555500284	tenant-uid	1782443830872	Load Contact 284	915555500284	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
286	915555500285	tenant-uid	1782443830872	Load Contact 285	915555500285	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
287	915555500286	tenant-uid	1782443830872	Load Contact 286	915555500286	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
288	915555500287	tenant-uid	1782443830872	Load Contact 287	915555500287	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
289	915555500288	tenant-uid	1782443830872	Load Contact 288	915555500288	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
290	915555500289	tenant-uid	1782443830872	Load Contact 289	915555500289	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
291	915555500290	tenant-uid	1782443830872	Load Contact 290	915555500290	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
292	915555500291	tenant-uid	1782443830872	Load Contact 291	915555500291	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
293	915555500292	tenant-uid	1782443830872	Load Contact 292	915555500292	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
294	915555500293	tenant-uid	1782443830872	Load Contact 293	915555500293	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
295	915555500294	tenant-uid	1782443830872	Load Contact 294	915555500294	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
296	915555500295	tenant-uid	1782443830873	Load Contact 295	915555500295	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
297	915555500296	tenant-uid	1782443830873	Load Contact 296	915555500296	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
298	915555500297	tenant-uid	1782443830873	Load Contact 297	915555500297	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
299	915555500298	tenant-uid	1782443830873	Load Contact 298	915555500298	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
300	915555500299	tenant-uid	1782443830873	Load Contact 299	915555500299	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
301	915555500300	tenant-uid	1782443830873	Load Contact 300	915555500300	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.873488+00	2026-06-26 03:17:10.873488+00	agent-1-uid	\N	\N	\N	\N	0	0
302	915555500301	tenant-uid	1782443830876	Load Contact 301	915555500301	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
303	915555500302	tenant-uid	1782443830876	Load Contact 302	915555500302	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
304	915555500303	tenant-uid	1782443830876	Load Contact 303	915555500303	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
305	915555500304	tenant-uid	1782443830876	Load Contact 304	915555500304	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
306	915555500305	tenant-uid	1782443830876	Load Contact 305	915555500305	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
307	915555500306	tenant-uid	1782443830876	Load Contact 306	915555500306	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
308	915555500307	tenant-uid	1782443830876	Load Contact 307	915555500307	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
309	915555500308	tenant-uid	1782443830876	Load Contact 308	915555500308	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
310	915555500309	tenant-uid	1782443830876	Load Contact 309	915555500309	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
311	915555500310	tenant-uid	1782443830876	Load Contact 310	915555500310	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
312	915555500311	tenant-uid	1782443830876	Load Contact 311	915555500311	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
313	915555500312	tenant-uid	1782443830876	Load Contact 312	915555500312	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
314	915555500313	tenant-uid	1782443830876	Load Contact 313	915555500313	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
315	915555500314	tenant-uid	1782443830876	Load Contact 314	915555500314	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
316	915555500315	tenant-uid	1782443830876	Load Contact 315	915555500315	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
317	915555500316	tenant-uid	1782443830876	Load Contact 316	915555500316	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
318	915555500317	tenant-uid	1782443830876	Load Contact 317	915555500317	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
319	915555500318	tenant-uid	1782443830876	Load Contact 318	915555500318	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
320	915555500319	tenant-uid	1782443830876	Load Contact 319	915555500319	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
321	915555500320	tenant-uid	1782443830876	Load Contact 320	915555500320	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
322	915555500321	tenant-uid	1782443830876	Load Contact 321	915555500321	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
323	915555500322	tenant-uid	1782443830876	Load Contact 322	915555500322	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
324	915555500323	tenant-uid	1782443830876	Load Contact 323	915555500323	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
325	915555500324	tenant-uid	1782443830877	Load Contact 324	915555500324	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
326	915555500325	tenant-uid	1782443830877	Load Contact 325	915555500325	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
327	915555500326	tenant-uid	1782443830877	Load Contact 326	915555500326	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
328	915555500327	tenant-uid	1782443830877	Load Contact 327	915555500327	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
329	915555500328	tenant-uid	1782443830877	Load Contact 328	915555500328	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
330	915555500329	tenant-uid	1782443830877	Load Contact 329	915555500329	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
331	915555500330	tenant-uid	1782443830877	Load Contact 330	915555500330	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
332	915555500331	tenant-uid	1782443830877	Load Contact 331	915555500331	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
333	915555500332	tenant-uid	1782443830877	Load Contact 332	915555500332	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
334	915555500333	tenant-uid	1782443830877	Load Contact 333	915555500333	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
335	915555500334	tenant-uid	1782443830877	Load Contact 334	915555500334	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
336	915555500335	tenant-uid	1782443830877	Load Contact 335	915555500335	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
337	915555500336	tenant-uid	1782443830877	Load Contact 336	915555500336	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
338	915555500337	tenant-uid	1782443830877	Load Contact 337	915555500337	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
339	915555500338	tenant-uid	1782443830877	Load Contact 338	915555500338	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
340	915555500339	tenant-uid	1782443830877	Load Contact 339	915555500339	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
341	915555500340	tenant-uid	1782443830877	Load Contact 340	915555500340	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
342	915555500341	tenant-uid	1782443830877	Load Contact 341	915555500341	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
343	915555500342	tenant-uid	1782443830877	Load Contact 342	915555500342	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
344	915555500343	tenant-uid	1782443830877	Load Contact 343	915555500343	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
345	915555500344	tenant-uid	1782443830877	Load Contact 344	915555500344	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
346	915555500345	tenant-uid	1782443830877	Load Contact 345	915555500345	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
347	915555500346	tenant-uid	1782443830877	Load Contact 346	915555500346	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
348	915555500347	tenant-uid	1782443830877	Load Contact 347	915555500347	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
349	915555500348	tenant-uid	1782443830877	Load Contact 348	915555500348	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
350	915555500349	tenant-uid	1782443830877	Load Contact 349	915555500349	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
351	915555500350	tenant-uid	1782443830877	Load Contact 350	915555500350	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
352	915555500351	tenant-uid	1782443830877	Load Contact 351	915555500351	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
353	915555500352	tenant-uid	1782443830877	Load Contact 352	915555500352	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
354	915555500353	tenant-uid	1782443830877	Load Contact 353	915555500353	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
355	915555500354	tenant-uid	1782443830877	Load Contact 354	915555500354	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
356	915555500355	tenant-uid	1782443830877	Load Contact 355	915555500355	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
357	915555500356	tenant-uid	1782443830877	Load Contact 356	915555500356	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
358	915555500357	tenant-uid	1782443830878	Load Contact 357	915555500357	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
359	915555500358	tenant-uid	1782443830878	Load Contact 358	915555500358	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
360	915555500359	tenant-uid	1782443830878	Load Contact 359	915555500359	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
361	915555500360	tenant-uid	1782443830878	Load Contact 360	915555500360	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
362	915555500361	tenant-uid	1782443830878	Load Contact 361	915555500361	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
363	915555500362	tenant-uid	1782443830878	Load Contact 362	915555500362	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
364	915555500363	tenant-uid	1782443830878	Load Contact 363	915555500363	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
365	915555500364	tenant-uid	1782443830878	Load Contact 364	915555500364	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
366	915555500365	tenant-uid	1782443830878	Load Contact 365	915555500365	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
367	915555500366	tenant-uid	1782443830878	Load Contact 366	915555500366	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
368	915555500367	tenant-uid	1782443830878	Load Contact 367	915555500367	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
369	915555500368	tenant-uid	1782443830878	Load Contact 368	915555500368	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
370	915555500369	tenant-uid	1782443830878	Load Contact 369	915555500369	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
371	915555500370	tenant-uid	1782443830878	Load Contact 370	915555500370	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
372	915555500371	tenant-uid	1782443830878	Load Contact 371	915555500371	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
373	915555500372	tenant-uid	1782443830878	Load Contact 372	915555500372	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
374	915555500373	tenant-uid	1782443830878	Load Contact 373	915555500373	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
375	915555500374	tenant-uid	1782443830878	Load Contact 374	915555500374	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
376	915555500375	tenant-uid	1782443830878	Load Contact 375	915555500375	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
377	915555500376	tenant-uid	1782443830878	Load Contact 376	915555500376	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
378	915555500377	tenant-uid	1782443830878	Load Contact 377	915555500377	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
379	915555500378	tenant-uid	1782443830878	Load Contact 378	915555500378	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
380	915555500379	tenant-uid	1782443830878	Load Contact 379	915555500379	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
381	915555500380	tenant-uid	1782443830878	Load Contact 380	915555500380	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
382	915555500381	tenant-uid	1782443830878	Load Contact 381	915555500381	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
383	915555500382	tenant-uid	1782443830878	Load Contact 382	915555500382	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
384	915555500383	tenant-uid	1782443830878	Load Contact 383	915555500383	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
385	915555500384	tenant-uid	1782443830878	Load Contact 384	915555500384	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
386	915555500385	tenant-uid	1782443830878	Load Contact 385	915555500385	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
387	915555500386	tenant-uid	1782443830878	Load Contact 386	915555500386	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
388	915555500387	tenant-uid	1782443830878	Load Contact 387	915555500387	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
389	915555500388	tenant-uid	1782443830878	Load Contact 388	915555500388	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
390	915555500389	tenant-uid	1782443830878	Load Contact 389	915555500389	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
391	915555500390	tenant-uid	1782443830879	Load Contact 390	915555500390	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
392	915555500391	tenant-uid	1782443830879	Load Contact 391	915555500391	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
393	915555500392	tenant-uid	1782443830879	Load Contact 392	915555500392	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
394	915555500393	tenant-uid	1782443830879	Load Contact 393	915555500393	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
395	915555500394	tenant-uid	1782443830879	Load Contact 394	915555500394	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
396	915555500395	tenant-uid	1782443830879	Load Contact 395	915555500395	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
397	915555500396	tenant-uid	1782443830879	Load Contact 396	915555500396	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
398	915555500397	tenant-uid	1782443830879	Load Contact 397	915555500397	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
399	915555500398	tenant-uid	1782443830879	Load Contact 398	915555500398	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
400	915555500399	tenant-uid	1782443830879	Load Contact 399	915555500399	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
401	915555500400	tenant-uid	1782443830879	Load Contact 400	915555500400	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.879602+00	2026-06-26 03:17:10.879602+00	agent-1-uid	\N	\N	\N	\N	0	0
402	915555500401	tenant-uid	1782443830882	Load Contact 401	915555500401	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
403	915555500402	tenant-uid	1782443830882	Load Contact 402	915555500402	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
404	915555500403	tenant-uid	1782443830882	Load Contact 403	915555500403	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
405	915555500404	tenant-uid	1782443830882	Load Contact 404	915555500404	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
406	915555500405	tenant-uid	1782443830882	Load Contact 405	915555500405	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
407	915555500406	tenant-uid	1782443830882	Load Contact 406	915555500406	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
408	915555500407	tenant-uid	1782443830882	Load Contact 407	915555500407	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
409	915555500408	tenant-uid	1782443830882	Load Contact 408	915555500408	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
410	915555500409	tenant-uid	1782443830882	Load Contact 409	915555500409	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
411	915555500410	tenant-uid	1782443830882	Load Contact 410	915555500410	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
412	915555500411	tenant-uid	1782443830882	Load Contact 411	915555500411	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
413	915555500412	tenant-uid	1782443830882	Load Contact 412	915555500412	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
414	915555500413	tenant-uid	1782443830882	Load Contact 413	915555500413	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
415	915555500414	tenant-uid	1782443830882	Load Contact 414	915555500414	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
416	915555500415	tenant-uid	1782443830882	Load Contact 415	915555500415	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
417	915555500416	tenant-uid	1782443830882	Load Contact 416	915555500416	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
418	915555500417	tenant-uid	1782443830883	Load Contact 417	915555500417	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
419	915555500418	tenant-uid	1782443830883	Load Contact 418	915555500418	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
420	915555500419	tenant-uid	1782443830883	Load Contact 419	915555500419	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
421	915555500420	tenant-uid	1782443830883	Load Contact 420	915555500420	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
422	915555500421	tenant-uid	1782443830883	Load Contact 421	915555500421	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
423	915555500422	tenant-uid	1782443830883	Load Contact 422	915555500422	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
424	915555500423	tenant-uid	1782443830883	Load Contact 423	915555500423	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
425	915555500424	tenant-uid	1782443830883	Load Contact 424	915555500424	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
426	915555500425	tenant-uid	1782443830883	Load Contact 425	915555500425	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
427	915555500426	tenant-uid	1782443830883	Load Contact 426	915555500426	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
428	915555500427	tenant-uid	1782443830883	Load Contact 427	915555500427	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
429	915555500428	tenant-uid	1782443830883	Load Contact 428	915555500428	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
430	915555500429	tenant-uid	1782443830883	Load Contact 429	915555500429	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
431	915555500430	tenant-uid	1782443830883	Load Contact 430	915555500430	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
432	915555500431	tenant-uid	1782443830883	Load Contact 431	915555500431	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
433	915555500432	tenant-uid	1782443830883	Load Contact 432	915555500432	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
434	915555500433	tenant-uid	1782443830883	Load Contact 433	915555500433	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
435	915555500434	tenant-uid	1782443830883	Load Contact 434	915555500434	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
436	915555500435	tenant-uid	1782443830883	Load Contact 435	915555500435	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
437	915555500436	tenant-uid	1782443830883	Load Contact 436	915555500436	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
438	915555500437	tenant-uid	1782443830883	Load Contact 437	915555500437	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
439	915555500438	tenant-uid	1782443830883	Load Contact 438	915555500438	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
440	915555500439	tenant-uid	1782443830883	Load Contact 439	915555500439	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
441	915555500440	tenant-uid	1782443830883	Load Contact 440	915555500440	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
442	915555500441	tenant-uid	1782443830883	Load Contact 441	915555500441	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
443	915555500442	tenant-uid	1782443830883	Load Contact 442	915555500442	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
444	915555500443	tenant-uid	1782443830883	Load Contact 443	915555500443	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
445	915555500444	tenant-uid	1782443830883	Load Contact 444	915555500444	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
446	915555500445	tenant-uid	1782443830883	Load Contact 445	915555500445	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
447	915555500446	tenant-uid	1782443830883	Load Contact 446	915555500446	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
448	915555500447	tenant-uid	1782443830883	Load Contact 447	915555500447	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
449	915555500448	tenant-uid	1782443830883	Load Contact 448	915555500448	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
450	915555500449	tenant-uid	1782443830884	Load Contact 449	915555500449	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
451	915555500450	tenant-uid	1782443830884	Load Contact 450	915555500450	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
452	915555500451	tenant-uid	1782443830884	Load Contact 451	915555500451	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
453	915555500452	tenant-uid	1782443830884	Load Contact 452	915555500452	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
454	915555500453	tenant-uid	1782443830884	Load Contact 453	915555500453	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
455	915555500454	tenant-uid	1782443830884	Load Contact 454	915555500454	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
456	915555500455	tenant-uid	1782443830884	Load Contact 455	915555500455	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
457	915555500456	tenant-uid	1782443830884	Load Contact 456	915555500456	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
458	915555500457	tenant-uid	1782443830884	Load Contact 457	915555500457	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
459	915555500458	tenant-uid	1782443830884	Load Contact 458	915555500458	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
460	915555500459	tenant-uid	1782443830884	Load Contact 459	915555500459	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
461	915555500460	tenant-uid	1782443830884	Load Contact 460	915555500460	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
462	915555500461	tenant-uid	1782443830884	Load Contact 461	915555500461	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
463	915555500462	tenant-uid	1782443830884	Load Contact 462	915555500462	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
464	915555500463	tenant-uid	1782443830884	Load Contact 463	915555500463	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
465	915555500464	tenant-uid	1782443830884	Load Contact 464	915555500464	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
466	915555500465	tenant-uid	1782443830884	Load Contact 465	915555500465	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
467	915555500466	tenant-uid	1782443830884	Load Contact 466	915555500466	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
468	915555500467	tenant-uid	1782443830884	Load Contact 467	915555500467	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
469	915555500468	tenant-uid	1782443830884	Load Contact 468	915555500468	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
470	915555500469	tenant-uid	1782443830884	Load Contact 469	915555500469	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
471	915555500470	tenant-uid	1782443830884	Load Contact 470	915555500470	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
472	915555500471	tenant-uid	1782443830884	Load Contact 471	915555500471	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
473	915555500472	tenant-uid	1782443830884	Load Contact 472	915555500472	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
474	915555500473	tenant-uid	1782443830884	Load Contact 473	915555500473	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
475	915555500474	tenant-uid	1782443830884	Load Contact 474	915555500474	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
476	915555500475	tenant-uid	1782443830884	Load Contact 475	915555500475	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
477	915555500476	tenant-uid	1782443830884	Load Contact 476	915555500476	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
478	915555500477	tenant-uid	1782443830884	Load Contact 477	915555500477	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
479	915555500478	tenant-uid	1782443830884	Load Contact 478	915555500478	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
480	915555500479	tenant-uid	1782443830884	Load Contact 479	915555500479	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
481	915555500480	tenant-uid	1782443830884	Load Contact 480	915555500480	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
482	915555500481	tenant-uid	1782443830885	Load Contact 481	915555500481	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
483	915555500482	tenant-uid	1782443830885	Load Contact 482	915555500482	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
484	915555500483	tenant-uid	1782443830885	Load Contact 483	915555500483	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
485	915555500484	tenant-uid	1782443830885	Load Contact 484	915555500484	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
486	915555500485	tenant-uid	1782443830885	Load Contact 485	915555500485	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
487	915555500486	tenant-uid	1782443830885	Load Contact 486	915555500486	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
488	915555500487	tenant-uid	1782443830885	Load Contact 487	915555500487	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
489	915555500488	tenant-uid	1782443830885	Load Contact 488	915555500488	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
490	915555500489	tenant-uid	1782443830885	Load Contact 489	915555500489	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
491	915555500490	tenant-uid	1782443830885	Load Contact 490	915555500490	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
492	915555500491	tenant-uid	1782443830885	Load Contact 491	915555500491	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
493	915555500492	tenant-uid	1782443830885	Load Contact 492	915555500492	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
494	915555500493	tenant-uid	1782443830885	Load Contact 493	915555500493	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
495	915555500494	tenant-uid	1782443830885	Load Contact 494	915555500494	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
496	915555500495	tenant-uid	1782443830885	Load Contact 495	915555500495	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
497	915555500496	tenant-uid	1782443830885	Load Contact 496	915555500496	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
498	915555500497	tenant-uid	1782443830885	Load Contact 497	915555500497	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
499	915555500498	tenant-uid	1782443830885	Load Contact 498	915555500498	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
500	915555500499	tenant-uid	1782443830885	Load Contact 499	915555500499	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
501	915555500500	tenant-uid	1782443830885	Load Contact 500	915555500500	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.885861+00	2026-06-26 03:17:10.885861+00	agent-1-uid	\N	\N	\N	\N	0	0
502	915555500501	tenant-uid	1782443830888	Load Contact 501	915555500501	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
503	915555500502	tenant-uid	1782443830888	Load Contact 502	915555500502	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
504	915555500503	tenant-uid	1782443830888	Load Contact 503	915555500503	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
505	915555500504	tenant-uid	1782443830888	Load Contact 504	915555500504	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
506	915555500505	tenant-uid	1782443830888	Load Contact 505	915555500505	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
507	915555500506	tenant-uid	1782443830888	Load Contact 506	915555500506	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
508	915555500507	tenant-uid	1782443830888	Load Contact 507	915555500507	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
509	915555500508	tenant-uid	1782443830888	Load Contact 508	915555500508	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
510	915555500509	tenant-uid	1782443830889	Load Contact 509	915555500509	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
511	915555500510	tenant-uid	1782443830889	Load Contact 510	915555500510	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
512	915555500511	tenant-uid	1782443830889	Load Contact 511	915555500511	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
513	915555500512	tenant-uid	1782443830889	Load Contact 512	915555500512	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
514	915555500513	tenant-uid	1782443830889	Load Contact 513	915555500513	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
515	915555500514	tenant-uid	1782443830889	Load Contact 514	915555500514	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
516	915555500515	tenant-uid	1782443830889	Load Contact 515	915555500515	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
517	915555500516	tenant-uid	1782443830889	Load Contact 516	915555500516	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
518	915555500517	tenant-uid	1782443830889	Load Contact 517	915555500517	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
519	915555500518	tenant-uid	1782443830889	Load Contact 518	915555500518	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
520	915555500519	tenant-uid	1782443830889	Load Contact 519	915555500519	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
521	915555500520	tenant-uid	1782443830889	Load Contact 520	915555500520	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
522	915555500521	tenant-uid	1782443830889	Load Contact 521	915555500521	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
523	915555500522	tenant-uid	1782443830889	Load Contact 522	915555500522	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
524	915555500523	tenant-uid	1782443830889	Load Contact 523	915555500523	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
525	915555500524	tenant-uid	1782443830889	Load Contact 524	915555500524	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
526	915555500525	tenant-uid	1782443830889	Load Contact 525	915555500525	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
527	915555500526	tenant-uid	1782443830889	Load Contact 526	915555500526	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
528	915555500527	tenant-uid	1782443830889	Load Contact 527	915555500527	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
529	915555500528	tenant-uid	1782443830889	Load Contact 528	915555500528	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
530	915555500529	tenant-uid	1782443830889	Load Contact 529	915555500529	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
531	915555500530	tenant-uid	1782443830889	Load Contact 530	915555500530	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
532	915555500531	tenant-uid	1782443830889	Load Contact 531	915555500531	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
533	915555500532	tenant-uid	1782443830889	Load Contact 532	915555500532	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
534	915555500533	tenant-uid	1782443830889	Load Contact 533	915555500533	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
535	915555500534	tenant-uid	1782443830889	Load Contact 534	915555500534	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
536	915555500535	tenant-uid	1782443830889	Load Contact 535	915555500535	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
537	915555500536	tenant-uid	1782443830889	Load Contact 536	915555500536	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
538	915555500537	tenant-uid	1782443830889	Load Contact 537	915555500537	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
539	915555500538	tenant-uid	1782443830889	Load Contact 538	915555500538	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
540	915555500539	tenant-uid	1782443830889	Load Contact 539	915555500539	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
541	915555500540	tenant-uid	1782443830890	Load Contact 540	915555500540	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
542	915555500541	tenant-uid	1782443830890	Load Contact 541	915555500541	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
543	915555500542	tenant-uid	1782443830890	Load Contact 542	915555500542	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
544	915555500543	tenant-uid	1782443830890	Load Contact 543	915555500543	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
545	915555500544	tenant-uid	1782443830890	Load Contact 544	915555500544	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
546	915555500545	tenant-uid	1782443830890	Load Contact 545	915555500545	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
547	915555500546	tenant-uid	1782443830890	Load Contact 546	915555500546	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
548	915555500547	tenant-uid	1782443830890	Load Contact 547	915555500547	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
549	915555500548	tenant-uid	1782443830890	Load Contact 548	915555500548	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
550	915555500549	tenant-uid	1782443830890	Load Contact 549	915555500549	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
551	915555500550	tenant-uid	1782443830890	Load Contact 550	915555500550	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
552	915555500551	tenant-uid	1782443830890	Load Contact 551	915555500551	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
553	915555500552	tenant-uid	1782443830890	Load Contact 552	915555500552	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
554	915555500553	tenant-uid	1782443830890	Load Contact 553	915555500553	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
555	915555500554	tenant-uid	1782443830890	Load Contact 554	915555500554	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
556	915555500555	tenant-uid	1782443830890	Load Contact 555	915555500555	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
557	915555500556	tenant-uid	1782443830890	Load Contact 556	915555500556	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
558	915555500557	tenant-uid	1782443830890	Load Contact 557	915555500557	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
559	915555500558	tenant-uid	1782443830890	Load Contact 558	915555500558	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
560	915555500559	tenant-uid	1782443830890	Load Contact 559	915555500559	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
561	915555500560	tenant-uid	1782443830890	Load Contact 560	915555500560	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
562	915555500561	tenant-uid	1782443830890	Load Contact 561	915555500561	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
563	915555500562	tenant-uid	1782443830890	Load Contact 562	915555500562	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
564	915555500563	tenant-uid	1782443830890	Load Contact 563	915555500563	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
565	915555500564	tenant-uid	1782443830890	Load Contact 564	915555500564	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
566	915555500565	tenant-uid	1782443830890	Load Contact 565	915555500565	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
567	915555500566	tenant-uid	1782443830890	Load Contact 566	915555500566	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
568	915555500567	tenant-uid	1782443830890	Load Contact 567	915555500567	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
569	915555500568	tenant-uid	1782443830890	Load Contact 568	915555500568	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
570	915555500569	tenant-uid	1782443830890	Load Contact 569	915555500569	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
571	915555500570	tenant-uid	1782443830890	Load Contact 570	915555500570	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
572	915555500571	tenant-uid	1782443830891	Load Contact 571	915555500571	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
573	915555500572	tenant-uid	1782443830891	Load Contact 572	915555500572	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
574	915555500573	tenant-uid	1782443830891	Load Contact 573	915555500573	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
575	915555500574	tenant-uid	1782443830891	Load Contact 574	915555500574	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
576	915555500575	tenant-uid	1782443830891	Load Contact 575	915555500575	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
577	915555500576	tenant-uid	1782443830891	Load Contact 576	915555500576	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
578	915555500577	tenant-uid	1782443830891	Load Contact 577	915555500577	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
579	915555500578	tenant-uid	1782443830891	Load Contact 578	915555500578	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
580	915555500579	tenant-uid	1782443830891	Load Contact 579	915555500579	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
581	915555500580	tenant-uid	1782443830891	Load Contact 580	915555500580	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
582	915555500581	tenant-uid	1782443830891	Load Contact 581	915555500581	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
583	915555500582	tenant-uid	1782443830891	Load Contact 582	915555500582	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
584	915555500583	tenant-uid	1782443830891	Load Contact 583	915555500583	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
585	915555500584	tenant-uid	1782443830891	Load Contact 584	915555500584	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
586	915555500585	tenant-uid	1782443830891	Load Contact 585	915555500585	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
587	915555500586	tenant-uid	1782443830891	Load Contact 586	915555500586	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
588	915555500587	tenant-uid	1782443830891	Load Contact 587	915555500587	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
589	915555500588	tenant-uid	1782443830891	Load Contact 588	915555500588	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
590	915555500589	tenant-uid	1782443830891	Load Contact 589	915555500589	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
591	915555500590	tenant-uid	1782443830891	Load Contact 590	915555500590	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
592	915555500591	tenant-uid	1782443830891	Load Contact 591	915555500591	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
593	915555500592	tenant-uid	1782443830891	Load Contact 592	915555500592	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
594	915555500593	tenant-uid	1782443830891	Load Contact 593	915555500593	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
595	915555500594	tenant-uid	1782443830891	Load Contact 594	915555500594	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
596	915555500595	tenant-uid	1782443830891	Load Contact 595	915555500595	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
597	915555500596	tenant-uid	1782443830891	Load Contact 596	915555500596	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
598	915555500597	tenant-uid	1782443830891	Load Contact 597	915555500597	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
599	915555500598	tenant-uid	1782443830891	Load Contact 598	915555500598	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
600	915555500599	tenant-uid	1782443830891	Load Contact 599	915555500599	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
601	915555500600	tenant-uid	1782443830891	Load Contact 600	915555500600	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.892219+00	2026-06-26 03:17:10.892219+00	agent-1-uid	\N	\N	\N	\N	0	0
602	915555500601	tenant-uid	1782443830894	Load Contact 601	915555500601	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
603	915555500602	tenant-uid	1782443830894	Load Contact 602	915555500602	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
604	915555500603	tenant-uid	1782443830894	Load Contact 603	915555500603	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
605	915555500604	tenant-uid	1782443830894	Load Contact 604	915555500604	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
606	915555500605	tenant-uid	1782443830894	Load Contact 605	915555500605	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
607	915555500606	tenant-uid	1782443830895	Load Contact 606	915555500606	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
608	915555500607	tenant-uid	1782443830895	Load Contact 607	915555500607	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
609	915555500608	tenant-uid	1782443830895	Load Contact 608	915555500608	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
610	915555500609	tenant-uid	1782443830895	Load Contact 609	915555500609	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
611	915555500610	tenant-uid	1782443830895	Load Contact 610	915555500610	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
612	915555500611	tenant-uid	1782443830895	Load Contact 611	915555500611	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
613	915555500612	tenant-uid	1782443830895	Load Contact 612	915555500612	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
614	915555500613	tenant-uid	1782443830895	Load Contact 613	915555500613	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
615	915555500614	tenant-uid	1782443830895	Load Contact 614	915555500614	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
616	915555500615	tenant-uid	1782443830895	Load Contact 615	915555500615	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
617	915555500616	tenant-uid	1782443830895	Load Contact 616	915555500616	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
618	915555500617	tenant-uid	1782443830895	Load Contact 617	915555500617	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
619	915555500618	tenant-uid	1782443830895	Load Contact 618	915555500618	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
620	915555500619	tenant-uid	1782443830895	Load Contact 619	915555500619	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
621	915555500620	tenant-uid	1782443830895	Load Contact 620	915555500620	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
622	915555500621	tenant-uid	1782443830895	Load Contact 621	915555500621	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
623	915555500622	tenant-uid	1782443830895	Load Contact 622	915555500622	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
624	915555500623	tenant-uid	1782443830895	Load Contact 623	915555500623	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
625	915555500624	tenant-uid	1782443830895	Load Contact 624	915555500624	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
626	915555500625	tenant-uid	1782443830895	Load Contact 625	915555500625	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
627	915555500626	tenant-uid	1782443830895	Load Contact 626	915555500626	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
628	915555500627	tenant-uid	1782443830895	Load Contact 627	915555500627	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
629	915555500628	tenant-uid	1782443830895	Load Contact 628	915555500628	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
630	915555500629	tenant-uid	1782443830895	Load Contact 629	915555500629	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
631	915555500630	tenant-uid	1782443830895	Load Contact 630	915555500630	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
632	915555500631	tenant-uid	1782443830895	Load Contact 631	915555500631	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
633	915555500632	tenant-uid	1782443830895	Load Contact 632	915555500632	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
634	915555500633	tenant-uid	1782443830895	Load Contact 633	915555500633	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
635	915555500634	tenant-uid	1782443830895	Load Contact 634	915555500634	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
636	915555500635	tenant-uid	1782443830895	Load Contact 635	915555500635	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
637	915555500636	tenant-uid	1782443830895	Load Contact 636	915555500636	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
638	915555500637	tenant-uid	1782443830895	Load Contact 637	915555500637	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
639	915555500638	tenant-uid	1782443830896	Load Contact 638	915555500638	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
640	915555500639	tenant-uid	1782443830896	Load Contact 639	915555500639	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
641	915555500640	tenant-uid	1782443830896	Load Contact 640	915555500640	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
642	915555500641	tenant-uid	1782443830896	Load Contact 641	915555500641	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
643	915555500642	tenant-uid	1782443830896	Load Contact 642	915555500642	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
644	915555500643	tenant-uid	1782443830896	Load Contact 643	915555500643	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
645	915555500644	tenant-uid	1782443830896	Load Contact 644	915555500644	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
646	915555500645	tenant-uid	1782443830896	Load Contact 645	915555500645	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
647	915555500646	tenant-uid	1782443830896	Load Contact 646	915555500646	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
648	915555500647	tenant-uid	1782443830896	Load Contact 647	915555500647	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
649	915555500648	tenant-uid	1782443830896	Load Contact 648	915555500648	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
650	915555500649	tenant-uid	1782443830896	Load Contact 649	915555500649	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
651	915555500650	tenant-uid	1782443830896	Load Contact 650	915555500650	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
652	915555500651	tenant-uid	1782443830896	Load Contact 651	915555500651	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
653	915555500652	tenant-uid	1782443830896	Load Contact 652	915555500652	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
654	915555500653	tenant-uid	1782443830896	Load Contact 653	915555500653	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
655	915555500654	tenant-uid	1782443830896	Load Contact 654	915555500654	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
656	915555500655	tenant-uid	1782443830896	Load Contact 655	915555500655	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
657	915555500656	tenant-uid	1782443830896	Load Contact 656	915555500656	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
658	915555500657	tenant-uid	1782443830896	Load Contact 657	915555500657	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
659	915555500658	tenant-uid	1782443830896	Load Contact 658	915555500658	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
660	915555500659	tenant-uid	1782443830896	Load Contact 659	915555500659	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
661	915555500660	tenant-uid	1782443830896	Load Contact 660	915555500660	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
662	915555500661	tenant-uid	1782443830896	Load Contact 661	915555500661	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
663	915555500662	tenant-uid	1782443830896	Load Contact 662	915555500662	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
664	915555500663	tenant-uid	1782443830896	Load Contact 663	915555500663	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
665	915555500664	tenant-uid	1782443830896	Load Contact 664	915555500664	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
666	915555500665	tenant-uid	1782443830896	Load Contact 665	915555500665	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
667	915555500666	tenant-uid	1782443830896	Load Contact 666	915555500666	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
668	915555500667	tenant-uid	1782443830896	Load Contact 667	915555500667	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
669	915555500668	tenant-uid	1782443830896	Load Contact 668	915555500668	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
670	915555500669	tenant-uid	1782443830896	Load Contact 669	915555500669	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
671	915555500670	tenant-uid	1782443830896	Load Contact 670	915555500670	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
672	915555500671	tenant-uid	1782443830897	Load Contact 671	915555500671	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
673	915555500672	tenant-uid	1782443830897	Load Contact 672	915555500672	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
674	915555500673	tenant-uid	1782443830897	Load Contact 673	915555500673	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
675	915555500674	tenant-uid	1782443830897	Load Contact 674	915555500674	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
676	915555500675	tenant-uid	1782443830897	Load Contact 675	915555500675	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
677	915555500676	tenant-uid	1782443830897	Load Contact 676	915555500676	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
678	915555500677	tenant-uid	1782443830897	Load Contact 677	915555500677	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
679	915555500678	tenant-uid	1782443830897	Load Contact 678	915555500678	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
680	915555500679	tenant-uid	1782443830897	Load Contact 679	915555500679	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
681	915555500680	tenant-uid	1782443830897	Load Contact 680	915555500680	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
682	915555500681	tenant-uid	1782443830897	Load Contact 681	915555500681	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
683	915555500682	tenant-uid	1782443830897	Load Contact 682	915555500682	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
684	915555500683	tenant-uid	1782443830897	Load Contact 683	915555500683	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
685	915555500684	tenant-uid	1782443830897	Load Contact 684	915555500684	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
686	915555500685	tenant-uid	1782443830897	Load Contact 685	915555500685	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
687	915555500686	tenant-uid	1782443830897	Load Contact 686	915555500686	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
688	915555500687	tenant-uid	1782443830897	Load Contact 687	915555500687	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
689	915555500688	tenant-uid	1782443830897	Load Contact 688	915555500688	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
690	915555500689	tenant-uid	1782443830897	Load Contact 689	915555500689	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
691	915555500690	tenant-uid	1782443830897	Load Contact 690	915555500690	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
692	915555500691	tenant-uid	1782443830897	Load Contact 691	915555500691	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
693	915555500692	tenant-uid	1782443830897	Load Contact 692	915555500692	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
694	915555500693	tenant-uid	1782443830897	Load Contact 693	915555500693	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
695	915555500694	tenant-uid	1782443830897	Load Contact 694	915555500694	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
696	915555500695	tenant-uid	1782443830897	Load Contact 695	915555500695	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
697	915555500696	tenant-uid	1782443830897	Load Contact 696	915555500696	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
698	915555500697	tenant-uid	1782443830897	Load Contact 697	915555500697	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
699	915555500698	tenant-uid	1782443830897	Load Contact 698	915555500698	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
700	915555500699	tenant-uid	1782443830897	Load Contact 699	915555500699	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
701	915555500700	tenant-uid	1782443830897	Load Contact 700	915555500700	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.898177+00	2026-06-26 03:17:10.898177+00	agent-1-uid	\N	\N	\N	\N	0	0
702	915555500701	tenant-uid	1782443830900	Load Contact 701	915555500701	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
703	915555500702	tenant-uid	1782443830900	Load Contact 702	915555500702	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
704	915555500703	tenant-uid	1782443830901	Load Contact 703	915555500703	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
705	915555500704	tenant-uid	1782443830901	Load Contact 704	915555500704	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
706	915555500705	tenant-uid	1782443830901	Load Contact 705	915555500705	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
707	915555500706	tenant-uid	1782443830901	Load Contact 706	915555500706	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
708	915555500707	tenant-uid	1782443830901	Load Contact 707	915555500707	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
709	915555500708	tenant-uid	1782443830901	Load Contact 708	915555500708	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
710	915555500709	tenant-uid	1782443830901	Load Contact 709	915555500709	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
711	915555500710	tenant-uid	1782443830901	Load Contact 710	915555500710	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
712	915555500711	tenant-uid	1782443830901	Load Contact 711	915555500711	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
713	915555500712	tenant-uid	1782443830901	Load Contact 712	915555500712	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
714	915555500713	tenant-uid	1782443830901	Load Contact 713	915555500713	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
715	915555500714	tenant-uid	1782443830901	Load Contact 714	915555500714	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
716	915555500715	tenant-uid	1782443830902	Load Contact 715	915555500715	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
717	915555500716	tenant-uid	1782443830902	Load Contact 716	915555500716	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
718	915555500717	tenant-uid	1782443830902	Load Contact 717	915555500717	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
719	915555500718	tenant-uid	1782443830902	Load Contact 718	915555500718	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
720	915555500719	tenant-uid	1782443830902	Load Contact 719	915555500719	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
721	915555500720	tenant-uid	1782443830902	Load Contact 720	915555500720	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
722	915555500721	tenant-uid	1782443830902	Load Contact 721	915555500721	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
723	915555500722	tenant-uid	1782443830902	Load Contact 722	915555500722	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
724	915555500723	tenant-uid	1782443830902	Load Contact 723	915555500723	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
725	915555500724	tenant-uid	1782443830902	Load Contact 724	915555500724	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
726	915555500725	tenant-uid	1782443830902	Load Contact 725	915555500725	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
727	915555500726	tenant-uid	1782443830902	Load Contact 726	915555500726	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
728	915555500727	tenant-uid	1782443830902	Load Contact 727	915555500727	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
729	915555500728	tenant-uid	1782443830902	Load Contact 728	915555500728	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
730	915555500729	tenant-uid	1782443830902	Load Contact 729	915555500729	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
731	915555500730	tenant-uid	1782443830902	Load Contact 730	915555500730	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
732	915555500731	tenant-uid	1782443830902	Load Contact 731	915555500731	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
733	915555500732	tenant-uid	1782443830902	Load Contact 732	915555500732	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
734	915555500733	tenant-uid	1782443830902	Load Contact 733	915555500733	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
735	915555500734	tenant-uid	1782443830902	Load Contact 734	915555500734	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
736	915555500735	tenant-uid	1782443830902	Load Contact 735	915555500735	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
737	915555500736	tenant-uid	1782443830902	Load Contact 736	915555500736	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
738	915555500737	tenant-uid	1782443830902	Load Contact 737	915555500737	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
739	915555500738	tenant-uid	1782443830902	Load Contact 738	915555500738	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
740	915555500739	tenant-uid	1782443830902	Load Contact 739	915555500739	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
741	915555500740	tenant-uid	1782443830902	Load Contact 740	915555500740	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
742	915555500741	tenant-uid	1782443830902	Load Contact 741	915555500741	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
743	915555500742	tenant-uid	1782443830902	Load Contact 742	915555500742	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
744	915555500743	tenant-uid	1782443830902	Load Contact 743	915555500743	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
745	915555500744	tenant-uid	1782443830902	Load Contact 744	915555500744	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
746	915555500745	tenant-uid	1782443830902	Load Contact 745	915555500745	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
747	915555500746	tenant-uid	1782443830903	Load Contact 746	915555500746	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
748	915555500747	tenant-uid	1782443830903	Load Contact 747	915555500747	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
749	915555500748	tenant-uid	1782443830903	Load Contact 748	915555500748	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
750	915555500749	tenant-uid	1782443830903	Load Contact 749	915555500749	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
751	915555500750	tenant-uid	1782443830903	Load Contact 750	915555500750	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
752	915555500751	tenant-uid	1782443830903	Load Contact 751	915555500751	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
753	915555500752	tenant-uid	1782443830903	Load Contact 752	915555500752	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
754	915555500753	tenant-uid	1782443830903	Load Contact 753	915555500753	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
755	915555500754	tenant-uid	1782443830903	Load Contact 754	915555500754	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
756	915555500755	tenant-uid	1782443830903	Load Contact 755	915555500755	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
757	915555500756	tenant-uid	1782443830903	Load Contact 756	915555500756	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
758	915555500757	tenant-uid	1782443830903	Load Contact 757	915555500757	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
759	915555500758	tenant-uid	1782443830903	Load Contact 758	915555500758	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
760	915555500759	tenant-uid	1782443830903	Load Contact 759	915555500759	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
761	915555500760	tenant-uid	1782443830903	Load Contact 760	915555500760	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
762	915555500761	tenant-uid	1782443830903	Load Contact 761	915555500761	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
763	915555500762	tenant-uid	1782443830903	Load Contact 762	915555500762	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
764	915555500763	tenant-uid	1782443830903	Load Contact 763	915555500763	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
765	915555500764	tenant-uid	1782443830903	Load Contact 764	915555500764	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
766	915555500765	tenant-uid	1782443830903	Load Contact 765	915555500765	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
767	915555500766	tenant-uid	1782443830903	Load Contact 766	915555500766	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
768	915555500767	tenant-uid	1782443830903	Load Contact 767	915555500767	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
769	915555500768	tenant-uid	1782443830903	Load Contact 768	915555500768	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
770	915555500769	tenant-uid	1782443830903	Load Contact 769	915555500769	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
771	915555500770	tenant-uid	1782443830903	Load Contact 770	915555500770	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
772	915555500771	tenant-uid	1782443830903	Load Contact 771	915555500771	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
773	915555500772	tenant-uid	1782443830903	Load Contact 772	915555500772	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
774	915555500773	tenant-uid	1782443830903	Load Contact 773	915555500773	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
775	915555500774	tenant-uid	1782443830903	Load Contact 774	915555500774	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
776	915555500775	tenant-uid	1782443830903	Load Contact 775	915555500775	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
777	915555500776	tenant-uid	1782443830903	Load Contact 776	915555500776	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
778	915555500777	tenant-uid	1782443830904	Load Contact 777	915555500777	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
779	915555500778	tenant-uid	1782443830904	Load Contact 778	915555500778	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
780	915555500779	tenant-uid	1782443830904	Load Contact 779	915555500779	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
781	915555500780	tenant-uid	1782443830904	Load Contact 780	915555500780	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
782	915555500781	tenant-uid	1782443830904	Load Contact 781	915555500781	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
783	915555500782	tenant-uid	1782443830904	Load Contact 782	915555500782	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
784	915555500783	tenant-uid	1782443830904	Load Contact 783	915555500783	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
785	915555500784	tenant-uid	1782443830904	Load Contact 784	915555500784	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
786	915555500785	tenant-uid	1782443830904	Load Contact 785	915555500785	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
787	915555500786	tenant-uid	1782443830904	Load Contact 786	915555500786	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
788	915555500787	tenant-uid	1782443830904	Load Contact 787	915555500787	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
789	915555500788	tenant-uid	1782443830904	Load Contact 788	915555500788	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
790	915555500789	tenant-uid	1782443830904	Load Contact 789	915555500789	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
791	915555500790	tenant-uid	1782443830904	Load Contact 790	915555500790	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
792	915555500791	tenant-uid	1782443830904	Load Contact 791	915555500791	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
793	915555500792	tenant-uid	1782443830904	Load Contact 792	915555500792	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
794	915555500793	tenant-uid	1782443830904	Load Contact 793	915555500793	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
795	915555500794	tenant-uid	1782443830904	Load Contact 794	915555500794	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
796	915555500795	tenant-uid	1782443830904	Load Contact 795	915555500795	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
797	915555500796	tenant-uid	1782443830904	Load Contact 796	915555500796	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
798	915555500797	tenant-uid	1782443830904	Load Contact 797	915555500797	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
799	915555500798	tenant-uid	1782443830904	Load Contact 798	915555500798	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
800	915555500799	tenant-uid	1782443830904	Load Contact 799	915555500799	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
801	915555500800	tenant-uid	1782443830904	Load Contact 800	915555500800	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.905166+00	2026-06-26 03:17:10.905166+00	agent-1-uid	\N	\N	\N	\N	0	0
802	915555500801	tenant-uid	1782443830908	Load Contact 801	915555500801	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
803	915555500802	tenant-uid	1782443830908	Load Contact 802	915555500802	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
804	915555500803	tenant-uid	1782443830908	Load Contact 803	915555500803	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
805	915555500804	tenant-uid	1782443830908	Load Contact 804	915555500804	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
806	915555500805	tenant-uid	1782443830908	Load Contact 805	915555500805	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
807	915555500806	tenant-uid	1782443830908	Load Contact 806	915555500806	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
808	915555500807	tenant-uid	1782443830908	Load Contact 807	915555500807	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
809	915555500808	tenant-uid	1782443830908	Load Contact 808	915555500808	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
810	915555500809	tenant-uid	1782443830908	Load Contact 809	915555500809	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
811	915555500810	tenant-uid	1782443830908	Load Contact 810	915555500810	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
812	915555500811	tenant-uid	1782443830908	Load Contact 811	915555500811	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
813	915555500812	tenant-uid	1782443830908	Load Contact 812	915555500812	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
814	915555500813	tenant-uid	1782443830908	Load Contact 813	915555500813	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
815	915555500814	tenant-uid	1782443830908	Load Contact 814	915555500814	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
816	915555500815	tenant-uid	1782443830908	Load Contact 815	915555500815	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
817	915555500816	tenant-uid	1782443830908	Load Contact 816	915555500816	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
818	915555500817	tenant-uid	1782443830908	Load Contact 817	915555500817	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
819	915555500818	tenant-uid	1782443830908	Load Contact 818	915555500818	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
820	915555500819	tenant-uid	1782443830908	Load Contact 819	915555500819	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
821	915555500820	tenant-uid	1782443830908	Load Contact 820	915555500820	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
822	915555500821	tenant-uid	1782443830908	Load Contact 821	915555500821	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
823	915555500822	tenant-uid	1782443830908	Load Contact 822	915555500822	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
824	915555500823	tenant-uid	1782443830908	Load Contact 823	915555500823	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
825	915555500824	tenant-uid	1782443830908	Load Contact 824	915555500824	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
826	915555500825	tenant-uid	1782443830908	Load Contact 825	915555500825	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
827	915555500826	tenant-uid	1782443830908	Load Contact 826	915555500826	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
828	915555500827	tenant-uid	1782443830908	Load Contact 827	915555500827	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
829	915555500828	tenant-uid	1782443830909	Load Contact 828	915555500828	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
830	915555500829	tenant-uid	1782443830909	Load Contact 829	915555500829	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
831	915555500830	tenant-uid	1782443830909	Load Contact 830	915555500830	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
832	915555500831	tenant-uid	1782443830909	Load Contact 831	915555500831	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
833	915555500832	tenant-uid	1782443830909	Load Contact 832	915555500832	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
834	915555500833	tenant-uid	1782443830909	Load Contact 833	915555500833	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
835	915555500834	tenant-uid	1782443830909	Load Contact 834	915555500834	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
836	915555500835	tenant-uid	1782443830909	Load Contact 835	915555500835	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
837	915555500836	tenant-uid	1782443830909	Load Contact 836	915555500836	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
838	915555500837	tenant-uid	1782443830909	Load Contact 837	915555500837	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
839	915555500838	tenant-uid	1782443830909	Load Contact 838	915555500838	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
840	915555500839	tenant-uid	1782443830909	Load Contact 839	915555500839	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
841	915555500840	tenant-uid	1782443830909	Load Contact 840	915555500840	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
842	915555500841	tenant-uid	1782443830909	Load Contact 841	915555500841	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
843	915555500842	tenant-uid	1782443830909	Load Contact 842	915555500842	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
844	915555500843	tenant-uid	1782443830909	Load Contact 843	915555500843	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
845	915555500844	tenant-uid	1782443830909	Load Contact 844	915555500844	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
846	915555500845	tenant-uid	1782443830909	Load Contact 845	915555500845	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
847	915555500846	tenant-uid	1782443830909	Load Contact 846	915555500846	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
848	915555500847	tenant-uid	1782443830909	Load Contact 847	915555500847	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
849	915555500848	tenant-uid	1782443830909	Load Contact 848	915555500848	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
850	915555500849	tenant-uid	1782443830909	Load Contact 849	915555500849	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
851	915555500850	tenant-uid	1782443830909	Load Contact 850	915555500850	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
852	915555500851	tenant-uid	1782443830909	Load Contact 851	915555500851	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
853	915555500852	tenant-uid	1782443830909	Load Contact 852	915555500852	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
854	915555500853	tenant-uid	1782443830909	Load Contact 853	915555500853	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
855	915555500854	tenant-uid	1782443830909	Load Contact 854	915555500854	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
856	915555500855	tenant-uid	1782443830909	Load Contact 855	915555500855	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
857	915555500856	tenant-uid	1782443830909	Load Contact 856	915555500856	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
858	915555500857	tenant-uid	1782443830909	Load Contact 857	915555500857	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
859	915555500858	tenant-uid	1782443830909	Load Contact 858	915555500858	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
860	915555500859	tenant-uid	1782443830910	Load Contact 859	915555500859	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
861	915555500860	tenant-uid	1782443830910	Load Contact 860	915555500860	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
862	915555500861	tenant-uid	1782443830910	Load Contact 861	915555500861	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
863	915555500862	tenant-uid	1782443830910	Load Contact 862	915555500862	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
864	915555500863	tenant-uid	1782443830910	Load Contact 863	915555500863	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
865	915555500864	tenant-uid	1782443830910	Load Contact 864	915555500864	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
866	915555500865	tenant-uid	1782443830910	Load Contact 865	915555500865	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
867	915555500866	tenant-uid	1782443830910	Load Contact 866	915555500866	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
868	915555500867	tenant-uid	1782443830910	Load Contact 867	915555500867	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
869	915555500868	tenant-uid	1782443830910	Load Contact 868	915555500868	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
870	915555500869	tenant-uid	1782443830910	Load Contact 869	915555500869	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
871	915555500870	tenant-uid	1782443830910	Load Contact 870	915555500870	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
872	915555500871	tenant-uid	1782443830910	Load Contact 871	915555500871	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
873	915555500872	tenant-uid	1782443830910	Load Contact 872	915555500872	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
874	915555500873	tenant-uid	1782443830910	Load Contact 873	915555500873	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
875	915555500874	tenant-uid	1782443830910	Load Contact 874	915555500874	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
876	915555500875	tenant-uid	1782443830910	Load Contact 875	915555500875	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
877	915555500876	tenant-uid	1782443830910	Load Contact 876	915555500876	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
878	915555500877	tenant-uid	1782443830910	Load Contact 877	915555500877	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
879	915555500878	tenant-uid	1782443830910	Load Contact 878	915555500878	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
880	915555500879	tenant-uid	1782443830910	Load Contact 879	915555500879	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
881	915555500880	tenant-uid	1782443830910	Load Contact 880	915555500880	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
882	915555500881	tenant-uid	1782443830910	Load Contact 881	915555500881	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
883	915555500882	tenant-uid	1782443830910	Load Contact 882	915555500882	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
884	915555500883	tenant-uid	1782443830910	Load Contact 883	915555500883	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
885	915555500884	tenant-uid	1782443830910	Load Contact 884	915555500884	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
886	915555500885	tenant-uid	1782443830910	Load Contact 885	915555500885	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
887	915555500886	tenant-uid	1782443830910	Load Contact 886	915555500886	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
888	915555500887	tenant-uid	1782443830910	Load Contact 887	915555500887	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
889	915555500888	tenant-uid	1782443830910	Load Contact 888	915555500888	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
890	915555500889	tenant-uid	1782443830910	Load Contact 889	915555500889	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
891	915555500890	tenant-uid	1782443830910	Load Contact 890	915555500890	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
892	915555500891	tenant-uid	1782443830910	Load Contact 891	915555500891	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
893	915555500892	tenant-uid	1782443830911	Load Contact 892	915555500892	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
894	915555500893	tenant-uid	1782443830911	Load Contact 893	915555500893	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
895	915555500894	tenant-uid	1782443830911	Load Contact 894	915555500894	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
896	915555500895	tenant-uid	1782443830911	Load Contact 895	915555500895	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
897	915555500896	tenant-uid	1782443830911	Load Contact 896	915555500896	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
898	915555500897	tenant-uid	1782443830911	Load Contact 897	915555500897	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
899	915555500898	tenant-uid	1782443830911	Load Contact 898	915555500898	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
900	915555500899	tenant-uid	1782443830911	Load Contact 899	915555500899	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
901	915555500900	tenant-uid	1782443830911	Load Contact 900	915555500900	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.911523+00	2026-06-26 03:17:10.911523+00	agent-1-uid	\N	\N	\N	\N	0	0
902	915555500901	tenant-uid	1782443830914	Load Contact 901	915555500901	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
903	915555500902	tenant-uid	1782443830914	Load Contact 902	915555500902	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
904	915555500903	tenant-uid	1782443830914	Load Contact 903	915555500903	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
905	915555500904	tenant-uid	1782443830914	Load Contact 904	915555500904	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
906	915555500905	tenant-uid	1782443830914	Load Contact 905	915555500905	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
907	915555500906	tenant-uid	1782443830914	Load Contact 906	915555500906	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
908	915555500907	tenant-uid	1782443830914	Load Contact 907	915555500907	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
909	915555500908	tenant-uid	1782443830914	Load Contact 908	915555500908	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
910	915555500909	tenant-uid	1782443830914	Load Contact 909	915555500909	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
911	915555500910	tenant-uid	1782443830914	Load Contact 910	915555500910	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
912	915555500911	tenant-uid	1782443830914	Load Contact 911	915555500911	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
913	915555500912	tenant-uid	1782443830914	Load Contact 912	915555500912	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
914	915555500913	tenant-uid	1782443830914	Load Contact 913	915555500913	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
915	915555500914	tenant-uid	1782443830914	Load Contact 914	915555500914	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
916	915555500915	tenant-uid	1782443830914	Load Contact 915	915555500915	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
917	915555500916	tenant-uid	1782443830914	Load Contact 916	915555500916	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
918	915555500917	tenant-uid	1782443830914	Load Contact 917	915555500917	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
919	915555500918	tenant-uid	1782443830914	Load Contact 918	915555500918	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
920	915555500919	tenant-uid	1782443830914	Load Contact 919	915555500919	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
921	915555500920	tenant-uid	1782443830914	Load Contact 920	915555500920	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
922	915555500921	tenant-uid	1782443830914	Load Contact 921	915555500921	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
923	915555500922	tenant-uid	1782443830914	Load Contact 922	915555500922	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
924	915555500923	tenant-uid	1782443830914	Load Contact 923	915555500923	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
925	915555500924	tenant-uid	1782443830914	Load Contact 924	915555500924	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
926	915555500925	tenant-uid	1782443830914	Load Contact 925	915555500925	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
927	915555500926	tenant-uid	1782443830914	Load Contact 926	915555500926	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
928	915555500927	tenant-uid	1782443830914	Load Contact 927	915555500927	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
929	915555500928	tenant-uid	1782443830914	Load Contact 928	915555500928	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
930	915555500929	tenant-uid	1782443830914	Load Contact 929	915555500929	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
931	915555500930	tenant-uid	1782443830914	Load Contact 930	915555500930	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
932	915555500931	tenant-uid	1782443830915	Load Contact 931	915555500931	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
933	915555500932	tenant-uid	1782443830915	Load Contact 932	915555500932	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
934	915555500933	tenant-uid	1782443830915	Load Contact 933	915555500933	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
935	915555500934	tenant-uid	1782443830915	Load Contact 934	915555500934	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
936	915555500935	tenant-uid	1782443830915	Load Contact 935	915555500935	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
937	915555500936	tenant-uid	1782443830915	Load Contact 936	915555500936	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
938	915555500937	tenant-uid	1782443830915	Load Contact 937	915555500937	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
939	915555500938	tenant-uid	1782443830915	Load Contact 938	915555500938	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
940	915555500939	tenant-uid	1782443830915	Load Contact 939	915555500939	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
941	915555500940	tenant-uid	1782443830915	Load Contact 940	915555500940	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
942	915555500941	tenant-uid	1782443830915	Load Contact 941	915555500941	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
943	915555500942	tenant-uid	1782443830915	Load Contact 942	915555500942	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
944	915555500943	tenant-uid	1782443830915	Load Contact 943	915555500943	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
945	915555500944	tenant-uid	1782443830915	Load Contact 944	915555500944	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
946	915555500945	tenant-uid	1782443830915	Load Contact 945	915555500945	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
947	915555500946	tenant-uid	1782443830915	Load Contact 946	915555500946	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
948	915555500947	tenant-uid	1782443830915	Load Contact 947	915555500947	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
949	915555500948	tenant-uid	1782443830915	Load Contact 948	915555500948	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
950	915555500949	tenant-uid	1782443830915	Load Contact 949	915555500949	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
951	915555500950	tenant-uid	1782443830915	Load Contact 950	915555500950	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
952	915555500951	tenant-uid	1782443830915	Load Contact 951	915555500951	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
953	915555500952	tenant-uid	1782443830915	Load Contact 952	915555500952	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
954	915555500953	tenant-uid	1782443830915	Load Contact 953	915555500953	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
955	915555500954	tenant-uid	1782443830915	Load Contact 954	915555500954	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
956	915555500955	tenant-uid	1782443830915	Load Contact 955	915555500955	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
957	915555500956	tenant-uid	1782443830915	Load Contact 956	915555500956	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
958	915555500957	tenant-uid	1782443830915	Load Contact 957	915555500957	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
959	915555500958	tenant-uid	1782443830915	Load Contact 958	915555500958	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
960	915555500959	tenant-uid	1782443830915	Load Contact 959	915555500959	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
961	915555500960	tenant-uid	1782443830915	Load Contact 960	915555500960	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
962	915555500961	tenant-uid	1782443830915	Load Contact 961	915555500961	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
963	915555500962	tenant-uid	1782443830916	Load Contact 962	915555500962	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
964	915555500963	tenant-uid	1782443830916	Load Contact 963	915555500963	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
965	915555500964	tenant-uid	1782443830916	Load Contact 964	915555500964	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
966	915555500965	tenant-uid	1782443830916	Load Contact 965	915555500965	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
967	915555500966	tenant-uid	1782443830916	Load Contact 966	915555500966	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
968	915555500967	tenant-uid	1782443830916	Load Contact 967	915555500967	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
969	915555500968	tenant-uid	1782443830916	Load Contact 968	915555500968	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
970	915555500969	tenant-uid	1782443830916	Load Contact 969	915555500969	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
971	915555500970	tenant-uid	1782443830916	Load Contact 970	915555500970	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
972	915555500971	tenant-uid	1782443830916	Load Contact 971	915555500971	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
973	915555500972	tenant-uid	1782443830916	Load Contact 972	915555500972	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
974	915555500973	tenant-uid	1782443830916	Load Contact 973	915555500973	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
975	915555500974	tenant-uid	1782443830916	Load Contact 974	915555500974	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
976	915555500975	tenant-uid	1782443830916	Load Contact 975	915555500975	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
977	915555500976	tenant-uid	1782443830916	Load Contact 976	915555500976	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
978	915555500977	tenant-uid	1782443830916	Load Contact 977	915555500977	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
979	915555500978	tenant-uid	1782443830916	Load Contact 978	915555500978	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
980	915555500979	tenant-uid	1782443830916	Load Contact 979	915555500979	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
981	915555500980	tenant-uid	1782443830916	Load Contact 980	915555500980	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
982	915555500981	tenant-uid	1782443830916	Load Contact 981	915555500981	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
983	915555500982	tenant-uid	1782443830916	Load Contact 982	915555500982	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
984	915555500983	tenant-uid	1782443830916	Load Contact 983	915555500983	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
985	915555500984	tenant-uid	1782443830916	Load Contact 984	915555500984	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
986	915555500985	tenant-uid	1782443830916	Load Contact 985	915555500985	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
987	915555500986	tenant-uid	1782443830916	Load Contact 986	915555500986	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
988	915555500987	tenant-uid	1782443830916	Load Contact 987	915555500987	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
989	915555500988	tenant-uid	1782443830916	Load Contact 988	915555500988	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
990	915555500989	tenant-uid	1782443830916	Load Contact 989	915555500989	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
991	915555500990	tenant-uid	1782443830916	Load Contact 990	915555500990	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
992	915555500991	tenant-uid	1782443830916	Load Contact 991	915555500991	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
993	915555500992	tenant-uid	1782443830916	Load Contact 992	915555500992	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
994	915555500993	tenant-uid	1782443830916	Load Contact 993	915555500993	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
995	915555500994	tenant-uid	1782443830916	Load Contact 994	915555500994	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
996	915555500995	tenant-uid	1782443830917	Load Contact 995	915555500995	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
997	915555500996	tenant-uid	1782443830917	Load Contact 996	915555500996	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
998	915555500997	tenant-uid	1782443830917	Load Contact 997	915555500997	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
999	915555500998	tenant-uid	1782443830917	Load Contact 998	915555500998	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
1000	915555500999	tenant-uid	1782443830917	Load Contact 999	915555500999	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
1001	915555501000	tenant-uid	1782443830917	Load Contact 1000	915555501000	Load msg	0	open	\N	LOAD	META	\N	\N	2026-06-26 03:17:10.917446+00	2026-06-26 03:17:10.917446+00	agent-1-uid	\N	\N	\N	\N	0	0
\.


--
-- Data for Name: contact; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.contact (id, uid, phonebook_id, phonebook_name, name, mobile, var1, var2, var3, var4, var5, created_at, updated_at, auto_reply_disabled_until) FROM stdin;
\.


--
-- Data for Name: contact_form; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.contact_form (id, email, name, mobile, content, createdat) FROM stdin;
\.


--
-- Data for Name: crm_lead_activities; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.crm_lead_activities (id, uid, lead_id, activity_type, description, agent_uid, created_at) FROM stdin;
\.


--
-- Data for Name: crm_lead_reminders; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.crm_lead_reminders (id, uid, lead_id, title, remind_at, status, created_at) FROM stdin;
\.


--
-- Data for Name: crm_leads; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.crm_leads (id, uid, name, mobile, stage, owner_agent_uid, notes, value, created_at, updated_at, pipeline_order) FROM stdin;
\.


--
-- Data for Name: environments; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.environments (id, name, description) FROM stdin;
1	Production	Production active consumer environment
2	Staging	Pre-release testing environment
3	Development	Active operator drafting workspace
\.


--
-- Data for Name: escalation_queue; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.escalation_queue (id, uid, chat_id, reason, escalated_at, resolved, resolved_at) FROM stdin;
\.


--
-- Data for Name: faq; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.faq (id, question, answer, createdat) FROM stdin;
\.


--
-- Data for Name: flow; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.flow (id, uid, flow_id, title, prevent_list, ai_list, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: flow_data; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.flow_data (id, chatid, uid, uniqueid, inputs, other, last_node, disabled, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: flow_execution_logs; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.flow_execution_logs (id, execution_id, flow_id, node_id, status, error_message, execution_time, created_at) FROM stdin;
\.


--
-- Data for Name: flow_executions; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.flow_executions (id, flow_id, uid, sender_name, sender_mobile, status, current_node_id, variables, labels, execution_path, created_at, updated_at, version) FROM stdin;
\.


--
-- Data for Name: flow_templates; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.flow_templates (id, uid, version_id, name, category, thumbnail, description, author, rating, downloads, visibility, created_at) FROM stdin;
\.


--
-- Data for Name: flow_variables; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.flow_variables (id, uid, name, value, updated_at) FROM stdin;
\.


--
-- Data for Name: gen_links; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.gen_links (id, wa_mobile, email, msg, createdat) FROM stdin;
\.


--
-- Data for Name: instagram_api; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.instagram_api (id, uid, instagram_business_account_id, access_token, username, name, app_id, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: instance; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.instance (id, uid, title, uniqueid, status, other, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: knowledge_base; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.knowledge_base (id, uid, title, type, source_path, content, created_at, updated_at, status, index_error, indexed_at, embedding_model, chunk_count, priority, retry_count) FROM stdin;
\.


--
-- Data for Name: knowledge_base_chunks; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.knowledge_base_chunks (id, kb_id, uid, chunk_index, content, embedding, created_at, embedding_vector, doc_title, source_url, filename, updated_at) FROM stdin;
\.


--
-- Data for Name: meta_api; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.meta_api (id, uid, waba_id, business_account_id, access_token, business_phone_number_id, app_id, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: meta_templet_media; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.meta_templet_media (id, uid, templet_name, meta_hash, file_name, createdat) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.orders (id, uid, payment_mode, amount, data, s_token, createdat) FROM stdin;
\.


--
-- Data for Name: page; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.page (id, slug, title, image, content, permanent, createdat, updatedat) FROM stdin;
1	terms-and-conditions	Terms and Conditions	\N		1	2026-06-26 02:35:30.229625+00	2026-06-26 02:35:30.229625+00
2	privacy-policy	Privacy Policy	\N		1	2026-06-26 02:35:30.229625+00	2026-06-26 02:35:30.229625+00
\.


--
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.partners (id, filename, createdat) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.permissions (id, key, description) FROM stdin;
1	inbox.read	Read operator inbox messages and chats
2	inbox.reply	Reply to chats and send outbound template/custom messages
3	contacts.read	View contact details and lists
4	contacts.write	Create, edit, and update contacts
5	kb.read	View Knowledge Base library documents
6	kb.write	Upload documents, scrape website URLs, and add resources
7	kb.delete	Delete documents and resources from Knowledge Base
8	kb.reindex	Trigger manual re-indexing of documents
9	automation.read	View automation chat flows
10	automation.edit	Modify and construct chat flows in Builder
11	automation.publish	Publish/deploy chat flows
12	ai.inspector	Full access to AI Execution Logs and Developer Tools
13	ai.execution	Access AI execution details, timeline, variables, and overview metrics
14	ai.sources	View retrieved document citation links
15	ai.chunks	View text chunks, highlighted passages, and chunk indexes
16	ai.prompt	View LLM system and user prompt strings
17	ai.payload	View LLM raw API request and response JSON payloads
18	settings.ai	Manage AI Provider credentials and configs
19	settings.whatsapp	Manage WhatsApp Cloud API connection details
20	settings.users	Manage operator staff accounts, roles, and permissions
21	automation.rollback	Rollback visual flows to historical versions
22	automation.compare	Compare different versions of visual flows
23	automation.history	View flow version history lists and metrics
24	automation.template	Manage and clone flow templates
25	automation.export	Export flow schemas and snapshots as JSON
26	automation.import	Import flow schemas and snapshots as JSON
\.


--
-- Data for Name: phonebook; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.phonebook (id, uid, name, created_at, updated_at) FROM stdin;
1	tenant-uid	SAT Default Phonebook	2026-06-26 03:10:53.366045+00	2026-06-26 03:10:53.366045+00
2	tenant-uid	XSS Name <script>alert("xss")</script>	2026-06-26 03:21:37.085562+00	2026-06-26 03:21:37.085562+00
3	tenant-uid	XSS Name &lt;script&gt;alert("xss")&lt;/script&gt;	2026-06-26 03:25:26.382107+00	2026-06-26 03:25:26.382107+00
\.


--
-- Data for Name: plan; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.plan (id, title, short_description, allow_tag, allow_note, allow_chatbot, contact_limit, allow_api, is_trial, price, price_strike, plan_duration_in_days, created_at, updated_at) FROM stdin;
1	Trial	10-day evaluation for onboarding teams	1	1	1	1000	1	1	0.00	0.00	10	2026-06-26 02:35:30.22287+00	2026-06-26 02:35:30.22287+00
2	Premium	Core inbox, automation, and campaign workspace	1	1	1	100000	1	0	149.00	199.00	365	2026-06-26 02:35:30.22287+00	2026-06-26 02:35:30.22287+00
3	Platinum	Broader automation, API, and scaling controls	1	1	1	250000	1	0	299.00	399.00	365	2026-06-26 02:35:30.22287+00	2026-06-26 02:35:30.22287+00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
1	1
1	2
1	3
1	4
1	5
1	6
1	7
1	8
1	9
1	10
1	11
1	12
1	13
1	14
1	15
1	16
1	17
1	18
1	19
1	20
2	1
2	2
2	3
2	4
2	5
2	6
2	7
2	8
2	9
2	10
2	11
2	12
2	13
2	14
2	15
2	16
2	17
2	18
2	19
3	1
3	2
3	3
3	4
3	5
3	6
3	8
3	9
3	10
3	13
3	14
3	15
4	1
4	2
4	3
4	5
5	1
5	2
5	3
5	4
5	5
5	6
5	7
5	8
5	9
5	10
5	11
5	12
5	13
5	14
5	15
5	16
5	17
5	18
5	19
5	20
6	1
6	2
6	3
6	4
6	5
6	6
6	7
6	8
6	9
6	10
6	11
6	12
6	13
6	14
6	15
6	16
6	17
6	18
6	19
7	1
7	2
7	3
7	4
7	5
7	6
7	8
7	9
7	10
7	13
7	14
7	15
8	1
8	2
8	3
8	5
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.roles (id, uid, name, description, is_system, created_at) FROM stdin;
1	\N	Owner	Full access to all CRM workspace features and administration	t	2026-06-26 02:35:30.540528+00
2	\N	Admin	Administrative access to workspace configurations and features	t	2026-06-26 02:35:30.540528+00
3	\N	Manager	Management access to support, contacts, and knowledge resources	t	2026-06-26 02:35:30.540528+00
4	\N	Agent	Standard support agent access to reply to tickets and contacts	t	2026-06-26 02:35:30.540528+00
5	local-user-uid	Owner	Full access to all CRM workspace features and administration	f	2026-06-26 02:35:30.540528+00
6	local-user-uid	Admin	Administrative access to workspace configurations and features	f	2026-06-26 02:35:30.540528+00
7	local-user-uid	Manager	Management access to support, contacts, and knowledge resources	f	2026-06-26 02:35:30.540528+00
8	local-user-uid	Agent	Standard support agent access to reply to tickets and contacts	f	2026-06-26 02:35:30.540528+00
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.rooms (id, uid, socket_id, createdat) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.schema_migrations (filename, applied_at) FROM stdin;
000_create_base_schema.sql	2026-06-26 02:35:30.176882+00
001_create_plan.sql	2026-06-26 02:35:30.22287+00
002_create_core_app_tables.sql	2026-06-26 02:35:30.229625+00
003_cleanup_singleton_config.sql	2026-06-26 02:35:30.341451+00
004_add_campaign_dashboard_indexes.sql	2026-06-26 02:35:30.344155+00
005_add_phonebook_audience_count_index.sql	2026-06-26 02:35:30.359901+00
006_create_chatbot_log.sql	2026-06-26 02:35:30.36424+00
007_create_webhook_rules.sql	2026-06-26 02:35:30.375773+00
008_seed_dev_credentials.sql	2026-06-26 02:35:30.384558+00
009_fix_user_schema.sql	2026-06-26 02:35:30.386683+00
010_create_webhook_logs.sql	2026-06-26 02:35:30.389791+00
011_create_instagram_schema.sql	2026-06-26 02:35:30.398245+00
012_sprint11_crm_completion.sql	2026-06-26 02:35:30.407109+00
013_kanban_persistence.sql	2026-06-26 02:35:30.439909+00
014_campaign_retries.sql	2026-06-26 02:35:30.443252+00
015_deployment_settings.sql	2026-06-26 02:35:30.445652+00
016_mercadopago_settings.sql	2026-06-26 02:35:30.448624+00
017_agent_permissions.sql	2026-06-26 02:35:30.450525+00
018_chatbot_automation.sql	2026-06-26 02:35:30.452213+00
019_automation_executions_aliases.sql	2026-06-26 02:35:30.481153+00
020_add_auto_reply_disabled_until.sql	2026-06-26 02:35:30.485134+00
021_create_whatsapp_forms.sql	2026-06-26 02:35:30.487798+00
022_vector_rag_and_inspector.sql	2026-06-26 02:35:30.498333+00
023_enable_pgvector.sql	2026-06-26 02:35:30.515249+00
024_kb_production_improvements.sql	2026-06-26 02:35:30.534144+00
025_enterprise_permissions_and_activity.sql	2026-06-26 02:35:30.540528+00
026_flow_versioning.sql	2026-06-26 02:35:30.577441+00
027_multi_channel_platform.sql	2026-06-26 02:35:30.604439+00
028_transport_runtime.sql	2026-06-26 02:35:30.647677+00
\.


--
-- Data for Name: smtp; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.smtp (id, email, host, port, password, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: templets; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.templets (id, uid, content, type, title, createdat) FROM stdin;
\.


--
-- Data for Name: tenant_ai_providers; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.tenant_ai_providers (id, uid, provider, api_key, model, temperature, enabled, custom_endpoint, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: testimonial; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.testimonial (id, title, description, reviewer_name, reviewer_position, createdat) FROM stdin;
\.


--
-- Data for Name: transport_workers; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.transport_workers (worker_name, hostname, pid, status, last_seen, started_at, version) FROM stdin;
retryQueueWorker	Shadow	120113	STOPPED	2026-06-26 03:21:06.20042+00	2026-06-26 03:20:56.306811+00	1.0.0
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public."user" (id, uid, name, email, password, role, mobile_with_country_code, timezone, plan, plan_expire, trial, api_key, created_at, updated_at, createdat, updatedat) FROM stdin;
10	FsnZKdgWGf9xzLE9HcQResbQ4XazJeii	Test User	testuser1@example.com	$2b$10$fm7yEalPaD1mHjBLnKy/LeqYOBCC1vo165s6SDKHJ4ZG5VoF1NUyq	user	919999999999	Asia/Kolkata	\N	\N	0	\N	2026-06-26 03:06:39.75759+00	2026-06-26 03:06:39.75759+00	2026-06-26 03:06:39.75759+00	2026-06-26 03:06:39.75759+00
12	8HSI8sd5edC1HZJoZTnsbjP9WH0q4iap	User 1	user1@example.com	$2b$10$lKvJBS5/c9CGVVqIAakWG.a8lSU/wEIbkbWCJr2tn9q6bLsoYcMi.	user	918888888881	Asia/Kolkata	\N	\N	0	\N	2026-06-26 03:07:30.087734+00	2026-06-26 03:07:30.087734+00	2026-06-26 03:07:30.087734+00	2026-06-26 03:07:30.087734+00
13	DA2aFb6EINerwrYcRDYX4AFJibCrTrIN	User 2	user2@example.com	$2b$10$5N6diUOGqELBLAliceaoHeGfrGLiJm.lxv1I3NCckbL5vGY7lS86m	user	918888888882	Asia/Kolkata	\N	\N	0	\N	2026-06-26 03:07:30.129736+00	2026-06-26 03:07:30.129736+00	2026-06-26 03:07:30.129736+00	2026-06-26 03:07:30.129736+00
14	S0NNJL1cPiVca1R7C93mkqmDOLewvYUM	User 3	user3@example.com	$2b$10$hL5stDy/F3kwQiFztOwZRecBkc5sHCK7tPZNhiKoUQqBSKJwVi/A6	user	918888888883	Asia/Kolkata	\N	\N	0	\N	2026-06-26 03:07:30.171425+00	2026-06-26 03:07:30.171425+00	2026-06-26 03:07:30.171425+00	2026-06-26 03:07:30.171425+00
15	B9ZCNVEgTE1Nd92OQIuqWk7unjySHfhg	User 4	user4@example.com	$2b$10$Rl7oD0.RjTvt74sirRMtsOdmvx2/XEDzlyuCsT56RKYYyXUk/tR7i	user	918888888884	Asia/Kolkata	\N	\N	0	\N	2026-06-26 03:07:30.216714+00	2026-06-26 03:07:30.216714+00	2026-06-26 03:07:30.216714+00	2026-06-26 03:07:30.216714+00
16	Qlr7hK9EVOxNI24zcNWCWnteckmoO7Kt	User 5	user5@example.com	$2b$10$LgH5C1Pjy3AdkqbSOxAQE.sRoT2RfZXsLxHBda4/K6DdD6pohSHxe	user	918888888885	Asia/Kolkata	\N	\N	0	\N	2026-06-26 03:07:30.261306+00	2026-06-26 03:07:30.261306+00	2026-06-26 03:07:30.261306+00	2026-06-26 03:07:30.261306+00
11	tenant-uid	Tenant Admin	tenant@example.com	$2b$10$YJE8QvEYWdd98hkSjvnpJ.pAVjUpflN6Ns6i9AJJ74FC7b.5uDw/6	user	\N	Asia/Kolkata	{"contact_limit":100000,"allow_note":1,"allow_tag":1,"allow_chatbot":1,"allow_api":1}	4102444800000	0	\N	2026-06-26 03:07:29.995417+00	2026-06-26 03:07:29.995417+00	2026-06-26 03:07:29.995417+00	2026-06-26 03:07:29.995417+00
68	tenant-b	Tenant B	tenantb@example.com	password	user	\N	Asia/Kolkata	\N	\N	0	\N	2026-06-26 03:22:46.443756+00	2026-06-26 03:22:46.443756+00	2026-06-26 03:22:46.443756+00	2026-06-26 03:22:46.443756+00
1	local-user-uid	Local User	user@example.com	$2b$10$yK8QlZaVwHKU9Ga.iM700uK3UtFwiss3qrj4UxfeTJs7Z5coVr0Oe	user	\N	Asia/Kolkata	{"contact_limit":100000,"allow_note":1,"allow_tag":1,"allow_chatbot":1,"allow_api":1}	4102444800000	0	\N	2026-06-26 02:35:30.176882+00	2026-06-26 02:35:30.176882+00	2026-06-26 02:35:30.229625+00	2026-06-26 02:35:30.229625+00
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.user_permissions (id, uid, permission_id) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.user_roles (id, uid, role_id) FROM stdin;
1	local-user-uid	5
2	local-agent-uid	8
\.


--
-- Data for Name: web_private; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.web_private (id, pay_offline_id, pay_offline_key, offline_active, pay_stripe_id, pay_stripe_key, stripe_active, pay_paypal_id, pay_paypal_key, paypal_active, rz_id, rz_key, rz_active, pay_paystack_id, pay_paystack_key, paystack_active, createdat, updatedat, meta_app_id, meta_app_secret, meta_waba_id, meta_business_account_id, meta_access_token, meta_phone_number_id, insta_app_id, insta_app_secret, insta_business_account_id, insta_access_token, ai_provider_active, ai_openai_key, ai_openai_model, ai_gemini_key, ai_gemini_model, ai_claude_key, ai_claude_model, ai_openrouter_key, ai_openrouter_model, ai_ollama_url, ai_ollama_model, ai_custom_url, ai_custom_model, widget_domains, pay_mercadopago_id, pay_mercadopago_key, mercadopago_active) FROM stdin;
1	\N	\N	0	\N	\N	0	\N	\N	0	\N	\N	0	\N	\N	0	2026-06-26 02:35:30.229625+00	2026-06-26 02:35:30.229625+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0
\.


--
-- Data for Name: web_public; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.web_public (id, logo, app_name, custom_home, is_custom_home, meta_description, currency_code, currency_symbol, home_page_tutorial, chatbot_screen_tutorial, broadcast_screen_tutorial, login_header_footer, exchange_rate, google_client_id, google_login_active, fb_login_app_id, fb_login_app_sec, fb_login_active, rtl, createdat, updatedat) FROM stdin;
1	\N	B1G CRM	\N	0	\N	USD	$	\N	\N	\N	\N	1.0000	\N	0	\N	\N	0	0	2026-06-26 02:35:30.229625+00	2026-06-26 02:35:30.229625+00
\.


--
-- Data for Name: webhook_idempotency; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.webhook_idempotency (id, provider_message_id, processed_at) FROM stdin;
\.


--
-- Data for Name: webhook_logs; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.webhook_logs (id, uid, rule_id, rule_name, target_url, payload, response_status, response_body, createdat) FROM stdin;
\.


--
-- Data for Name: webhook_rules; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.webhook_rules (id, uid, name, source, event_type, match_field, match_operator, match_value, action_type, action_payload, active, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: website_integrations; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.website_integrations (id, uid, domain, verification_token, verified, tracking_code, widget_customization, lead_capture_enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: whatsapp_forms; Type: TABLE DATA; Schema: public; Owner: b1gcrm
--

COPY public.whatsapp_forms (id, uid, name, form_id, status, created_at) FROM stdin;
1	local-user-uid	New Test	95049511181580	PUBLISHED	2026-06-26 02:35:30.487798+00
2	local-user-uid	Contact Form	95042830645439	PUBLISHED	2026-06-26 02:35:30.487798+00
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 1, false);


--
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.admin_id_seq', 22, true);


--
-- Name: agent_chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.agent_chats_id_seq', 1, false);


--
-- Name: agent_response_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.agent_response_logs_id_seq', 1, false);


--
-- Name: agent_task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.agent_task_id_seq', 1, false);


--
-- Name: agents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.agents_id_seq', 30, true);


--
-- Name: ai_execution_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.ai_execution_logs_id_seq', 1, false);


--
-- Name: ai_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.ai_feedback_id_seq', 1, false);


--
-- Name: automation_edges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.automation_edges_id_seq', 1, false);


--
-- Name: automation_flow_version_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.automation_flow_version_metrics_id_seq', 1, false);


--
-- Name: automation_flow_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.automation_flow_versions_id_seq', 1, false);


--
-- Name: automation_flows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.automation_flows_id_seq', 1, false);


--
-- Name: automation_nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.automation_nodes_id_seq', 1, false);


--
-- Name: broadcast_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.broadcast_id_seq', 1, false);


--
-- Name: broadcast_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.broadcast_log_id_seq', 1, false);


--
-- Name: channel_connections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.channel_connections_id_seq', 24, true);


--
-- Name: channel_credentials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.channel_credentials_id_seq', 1, false);


--
-- Name: channel_dead_letter_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.channel_dead_letter_queue_id_seq', 1, false);


--
-- Name: channel_incoming_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.channel_incoming_queue_id_seq', 1, false);


--
-- Name: channel_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.channel_metrics_id_seq', 100, true);


--
-- Name: channel_outgoing_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.channel_outgoing_queue_id_seq', 200, true);


--
-- Name: channel_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.channel_settings_id_seq', 1, false);


--
-- Name: chat_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.chat_tags_id_seq', 1, false);


--
-- Name: chat_widget_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.chat_widget_id_seq', 1, false);


--
-- Name: chatbot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.chatbot_id_seq', 1, false);


--
-- Name: chatbot_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.chatbot_log_id_seq', 1, false);


--
-- Name: chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.chats_id_seq', 1991, true);


--
-- Name: contact_form_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.contact_form_id_seq', 1, false);


--
-- Name: contact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.contact_id_seq', 1, false);


--
-- Name: crm_lead_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.crm_lead_activities_id_seq', 1, false);


--
-- Name: crm_lead_reminders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.crm_lead_reminders_id_seq', 1, false);


--
-- Name: crm_leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.crm_leads_id_seq', 1, false);


--
-- Name: environments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.environments_id_seq', 3, true);


--
-- Name: escalation_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.escalation_queue_id_seq', 1, false);


--
-- Name: faq_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.faq_id_seq', 1, false);


--
-- Name: flow_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.flow_data_id_seq', 1, false);


--
-- Name: flow_execution_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.flow_execution_logs_id_seq', 1, false);


--
-- Name: flow_executions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.flow_executions_id_seq', 1, false);


--
-- Name: flow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.flow_id_seq', 1, false);


--
-- Name: flow_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.flow_templates_id_seq', 1, false);


--
-- Name: flow_variables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.flow_variables_id_seq', 1, false);


--
-- Name: gen_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.gen_links_id_seq', 1, false);


--
-- Name: instagram_api_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.instagram_api_id_seq', 1, false);


--
-- Name: instance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.instance_id_seq', 1, false);


--
-- Name: knowledge_base_chunks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.knowledge_base_chunks_id_seq', 1, false);


--
-- Name: knowledge_base_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.knowledge_base_id_seq', 1, false);


--
-- Name: meta_api_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.meta_api_id_seq', 1, false);


--
-- Name: meta_templet_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.meta_templet_media_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: page_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.page_id_seq', 2, true);


--
-- Name: partners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.partners_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.permissions_id_seq', 26, true);


--
-- Name: phonebook_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.phonebook_id_seq', 3, true);


--
-- Name: plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.plan_id_seq', 3, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.roles_id_seq', 8, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.rooms_id_seq', 1, false);


--
-- Name: smtp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.smtp_id_seq', 1, false);


--
-- Name: templets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.templets_id_seq', 1, false);


--
-- Name: tenant_ai_providers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.tenant_ai_providers_id_seq', 1, false);


--
-- Name: testimonial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.testimonial_id_seq', 1, false);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.user_id_seq', 70, true);


--
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 1, false);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 2, true);


--
-- Name: web_private_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.web_private_id_seq', 1, true);


--
-- Name: web_public_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.web_public_id_seq', 1, true);


--
-- Name: webhook_idempotency_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.webhook_idempotency_id_seq', 1, false);


--
-- Name: webhook_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.webhook_logs_id_seq', 1, false);


--
-- Name: webhook_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.webhook_rules_id_seq', 1, false);


--
-- Name: website_integrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.website_integrations_id_seq', 1, false);


--
-- Name: whatsapp_forms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: b1gcrm
--

SELECT pg_catalog.setval('public.whatsapp_forms_id_seq', 2, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: admin admin_email_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_email_key UNIQUE (email);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- Name: admin admin_uid_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_uid_key UNIQUE (uid);


--
-- Name: agent_chats agent_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.agent_chats
    ADD CONSTRAINT agent_chats_pkey PRIMARY KEY (id);


--
-- Name: agent_response_logs agent_response_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.agent_response_logs
    ADD CONSTRAINT agent_response_logs_pkey PRIMARY KEY (id);


--
-- Name: agent_task agent_task_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.agent_task
    ADD CONSTRAINT agent_task_pkey PRIMARY KEY (id);


--
-- Name: agents agents_email_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_email_key UNIQUE (email);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: agents agents_uid_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_uid_key UNIQUE (uid);


--
-- Name: ai_execution_logs ai_execution_logs_execution_id_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.ai_execution_logs
    ADD CONSTRAINT ai_execution_logs_execution_id_key UNIQUE (execution_id);


--
-- Name: ai_execution_logs ai_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.ai_execution_logs
    ADD CONSTRAINT ai_execution_logs_pkey PRIMARY KEY (id);


--
-- Name: ai_feedback ai_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.ai_feedback
    ADD CONSTRAINT ai_feedback_pkey PRIMARY KEY (id);


--
-- Name: automation_edges automation_edges_flow_id_edge_id_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_edges
    ADD CONSTRAINT automation_edges_flow_id_edge_id_key UNIQUE (flow_id, edge_id);


--
-- Name: automation_edges automation_edges_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_edges
    ADD CONSTRAINT automation_edges_pkey PRIMARY KEY (id);


--
-- Name: automation_flow_version_metrics automation_flow_version_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_flow_version_metrics
    ADD CONSTRAINT automation_flow_version_metrics_pkey PRIMARY KEY (id);


--
-- Name: automation_flow_version_metrics automation_flow_version_metrics_version_id_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_flow_version_metrics
    ADD CONSTRAINT automation_flow_version_metrics_version_id_key UNIQUE (version_id);


--
-- Name: automation_flow_versions automation_flow_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_flow_versions
    ADD CONSTRAINT automation_flow_versions_pkey PRIMARY KEY (id);


--
-- Name: automation_flow_versions automation_flow_versions_uid_flow_id_version_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_flow_versions
    ADD CONSTRAINT automation_flow_versions_uid_flow_id_version_key UNIQUE (uid, flow_id, version);


--
-- Name: automation_flows automation_flows_flow_id_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_flows
    ADD CONSTRAINT automation_flows_flow_id_key UNIQUE (flow_id);


--
-- Name: automation_flows automation_flows_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_flows
    ADD CONSTRAINT automation_flows_pkey PRIMARY KEY (id);


--
-- Name: automation_nodes automation_nodes_flow_id_node_id_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_nodes
    ADD CONSTRAINT automation_nodes_flow_id_node_id_key UNIQUE (flow_id, node_id);


--
-- Name: automation_nodes automation_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_nodes
    ADD CONSTRAINT automation_nodes_pkey PRIMARY KEY (id);


--
-- Name: broadcast_log broadcast_log_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.broadcast_log
    ADD CONSTRAINT broadcast_log_pkey PRIMARY KEY (id);


--
-- Name: broadcast broadcast_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.broadcast
    ADD CONSTRAINT broadcast_pkey PRIMARY KEY (id);


--
-- Name: channel_connections channel_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_connections
    ADD CONSTRAINT channel_connections_pkey PRIMARY KEY (id);


--
-- Name: channel_connections channel_connections_uid_channel_type_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_connections
    ADD CONSTRAINT channel_connections_uid_channel_type_key UNIQUE (uid, channel_type);


--
-- Name: channel_credentials channel_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_credentials
    ADD CONSTRAINT channel_credentials_pkey PRIMARY KEY (id);


--
-- Name: channel_credentials channel_credentials_uid_channel_type_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_credentials
    ADD CONSTRAINT channel_credentials_uid_channel_type_key UNIQUE (uid, channel_type);


--
-- Name: channel_dead_letter_queue channel_dead_letter_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_dead_letter_queue
    ADD CONSTRAINT channel_dead_letter_queue_pkey PRIMARY KEY (id);


--
-- Name: channel_incoming_queue channel_incoming_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_incoming_queue
    ADD CONSTRAINT channel_incoming_queue_pkey PRIMARY KEY (id);


--
-- Name: channel_metrics channel_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_metrics
    ADD CONSTRAINT channel_metrics_pkey PRIMARY KEY (id);


--
-- Name: channel_metrics channel_metrics_uid_channel_type_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_metrics
    ADD CONSTRAINT channel_metrics_uid_channel_type_key UNIQUE (uid, channel_type);


--
-- Name: channel_outgoing_queue channel_outgoing_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_outgoing_queue
    ADD CONSTRAINT channel_outgoing_queue_pkey PRIMARY KEY (id);


--
-- Name: channel_settings channel_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_settings
    ADD CONSTRAINT channel_settings_pkey PRIMARY KEY (id);


--
-- Name: channel_settings channel_settings_uid_channel_type_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.channel_settings
    ADD CONSTRAINT channel_settings_uid_channel_type_key UNIQUE (uid, channel_type);


--
-- Name: chat_tags chat_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chat_tags
    ADD CONSTRAINT chat_tags_pkey PRIMARY KEY (id);


--
-- Name: chat_widget chat_widget_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chat_widget
    ADD CONSTRAINT chat_widget_pkey PRIMARY KEY (id);


--
-- Name: chat_widget chat_widget_unique_id_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chat_widget
    ADD CONSTRAINT chat_widget_unique_id_key UNIQUE (unique_id);


--
-- Name: chatbot_log chatbot_log_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chatbot_log
    ADD CONSTRAINT chatbot_log_pkey PRIMARY KEY (id);


--
-- Name: chatbot chatbot_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chatbot
    ADD CONSTRAINT chatbot_pkey PRIMARY KEY (id);


--
-- Name: chats chats_chat_id_uid_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_chat_id_uid_key UNIQUE (chat_id, uid);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: contact_form contact_form_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.contact_form
    ADD CONSTRAINT contact_form_pkey PRIMARY KEY (id);


--
-- Name: contact contact_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_pkey PRIMARY KEY (id);


--
-- Name: crm_lead_activities crm_lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.crm_lead_activities
    ADD CONSTRAINT crm_lead_activities_pkey PRIMARY KEY (id);


--
-- Name: crm_lead_reminders crm_lead_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.crm_lead_reminders
    ADD CONSTRAINT crm_lead_reminders_pkey PRIMARY KEY (id);


--
-- Name: crm_leads crm_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.crm_leads
    ADD CONSTRAINT crm_leads_pkey PRIMARY KEY (id);


--
-- Name: environments environments_name_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.environments
    ADD CONSTRAINT environments_name_key UNIQUE (name);


--
-- Name: environments environments_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.environments
    ADD CONSTRAINT environments_pkey PRIMARY KEY (id);


--
-- Name: escalation_queue escalation_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.escalation_queue
    ADD CONSTRAINT escalation_queue_pkey PRIMARY KEY (id);


--
-- Name: faq faq_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.faq
    ADD CONSTRAINT faq_pkey PRIMARY KEY (id);


--
-- Name: flow_data flow_data_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_data
    ADD CONSTRAINT flow_data_pkey PRIMARY KEY (id);


--
-- Name: flow_data flow_data_uniqueid_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_data
    ADD CONSTRAINT flow_data_uniqueid_key UNIQUE (uniqueid);


--
-- Name: flow_execution_logs flow_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_execution_logs
    ADD CONSTRAINT flow_execution_logs_pkey PRIMARY KEY (id);


--
-- Name: flow_executions flow_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_executions
    ADD CONSTRAINT flow_executions_pkey PRIMARY KEY (id);


--
-- Name: flow flow_flow_id_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow
    ADD CONSTRAINT flow_flow_id_key UNIQUE (flow_id);


--
-- Name: flow flow_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow
    ADD CONSTRAINT flow_pkey PRIMARY KEY (id);


--
-- Name: flow_templates flow_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_templates
    ADD CONSTRAINT flow_templates_pkey PRIMARY KEY (id);


--
-- Name: flow_templates flow_templates_version_id_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_templates
    ADD CONSTRAINT flow_templates_version_id_key UNIQUE (version_id);


--
-- Name: flow_variables flow_variables_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_variables
    ADD CONSTRAINT flow_variables_pkey PRIMARY KEY (id);


--
-- Name: flow_variables flow_variables_uid_name_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_variables
    ADD CONSTRAINT flow_variables_uid_name_key UNIQUE (uid, name);


--
-- Name: gen_links gen_links_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.gen_links
    ADD CONSTRAINT gen_links_pkey PRIMARY KEY (id);


--
-- Name: instagram_api instagram_api_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.instagram_api
    ADD CONSTRAINT instagram_api_pkey PRIMARY KEY (id);


--
-- Name: instagram_api instagram_api_uid_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.instagram_api
    ADD CONSTRAINT instagram_api_uid_key UNIQUE (uid);


--
-- Name: instance instance_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.instance
    ADD CONSTRAINT instance_pkey PRIMARY KEY (id);


--
-- Name: instance instance_uniqueid_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.instance
    ADD CONSTRAINT instance_uniqueid_key UNIQUE (uniqueid);


--
-- Name: knowledge_base_chunks knowledge_base_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.knowledge_base_chunks
    ADD CONSTRAINT knowledge_base_chunks_pkey PRIMARY KEY (id);


--
-- Name: knowledge_base knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_pkey PRIMARY KEY (id);


--
-- Name: meta_api meta_api_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.meta_api
    ADD CONSTRAINT meta_api_pkey PRIMARY KEY (id);


--
-- Name: meta_api meta_api_uid_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.meta_api
    ADD CONSTRAINT meta_api_uid_key UNIQUE (uid);


--
-- Name: meta_templet_media meta_templet_media_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.meta_templet_media
    ADD CONSTRAINT meta_templet_media_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: page page_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.page
    ADD CONSTRAINT page_pkey PRIMARY KEY (id);


--
-- Name: page page_slug_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.page
    ADD CONSTRAINT page_slug_key UNIQUE (slug);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_key_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_key_key UNIQUE (key);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: phonebook phonebook_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.phonebook
    ADD CONSTRAINT phonebook_pkey PRIMARY KEY (id);


--
-- Name: phonebook phonebook_uid_name_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.phonebook
    ADD CONSTRAINT phonebook_uid_name_key UNIQUE (uid, name);


--
-- Name: plan plan_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.plan
    ADD CONSTRAINT plan_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_uid_name_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_uid_name_key UNIQUE (uid, name);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (filename);


--
-- Name: smtp smtp_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.smtp
    ADD CONSTRAINT smtp_pkey PRIMARY KEY (id);


--
-- Name: templets templets_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.templets
    ADD CONSTRAINT templets_pkey PRIMARY KEY (id);


--
-- Name: tenant_ai_providers tenant_ai_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.tenant_ai_providers
    ADD CONSTRAINT tenant_ai_providers_pkey PRIMARY KEY (id);


--
-- Name: tenant_ai_providers tenant_ai_providers_uid_provider_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.tenant_ai_providers
    ADD CONSTRAINT tenant_ai_providers_uid_provider_key UNIQUE (uid, provider);


--
-- Name: testimonial testimonial_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.testimonial
    ADD CONSTRAINT testimonial_pkey PRIMARY KEY (id);


--
-- Name: transport_workers transport_workers_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.transport_workers
    ADD CONSTRAINT transport_workers_pkey PRIMARY KEY (worker_name);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_uid_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_uid_permission_id_key UNIQUE (uid, permission_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_uid_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_uid_key UNIQUE (uid);


--
-- Name: user user_uid_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_uid_key UNIQUE (uid);


--
-- Name: web_private web_private_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.web_private
    ADD CONSTRAINT web_private_pkey PRIMARY KEY (id);


--
-- Name: web_public web_public_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.web_public
    ADD CONSTRAINT web_public_pkey PRIMARY KEY (id);


--
-- Name: webhook_idempotency webhook_idempotency_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.webhook_idempotency
    ADD CONSTRAINT webhook_idempotency_pkey PRIMARY KEY (id);


--
-- Name: webhook_idempotency webhook_idempotency_provider_message_id_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.webhook_idempotency
    ADD CONSTRAINT webhook_idempotency_provider_message_id_key UNIQUE (provider_message_id);


--
-- Name: webhook_logs webhook_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.webhook_logs
    ADD CONSTRAINT webhook_logs_pkey PRIMARY KEY (id);


--
-- Name: webhook_rules webhook_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.webhook_rules
    ADD CONSTRAINT webhook_rules_pkey PRIMARY KEY (id);


--
-- Name: website_integrations website_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.website_integrations
    ADD CONSTRAINT website_integrations_pkey PRIMARY KEY (id);


--
-- Name: website_integrations website_integrations_uid_domain_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.website_integrations
    ADD CONSTRAINT website_integrations_uid_domain_key UNIQUE (uid, domain);


--
-- Name: whatsapp_forms whatsapp_forms_form_id_key; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.whatsapp_forms
    ADD CONSTRAINT whatsapp_forms_form_id_key UNIQUE (form_id);


--
-- Name: whatsapp_forms whatsapp_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.whatsapp_forms
    ADD CONSTRAINT whatsapp_forms_pkey PRIMARY KEY (id);


--
-- Name: idx_activity_logs_action; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_activity_logs_action ON public.activity_logs USING btree (action);


--
-- Name: idx_activity_logs_module; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_activity_logs_module ON public.activity_logs USING btree (module);


--
-- Name: idx_activity_logs_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_activity_logs_uid ON public.activity_logs USING btree (uid);


--
-- Name: idx_agent_chats_chat; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_agent_chats_chat ON public.agent_chats USING btree (chat_id);


--
-- Name: idx_agent_chats_owner; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_agent_chats_owner ON public.agent_chats USING btree (owner_uid);


--
-- Name: idx_agent_chats_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_agent_chats_uid ON public.agent_chats USING btree (uid);


--
-- Name: idx_agent_task_owner; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_agent_task_owner ON public.agent_task USING btree (owner_uid);


--
-- Name: idx_agent_task_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_agent_task_uid ON public.agent_task USING btree (uid);


--
-- Name: idx_agents_owner_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_agents_owner_uid ON public.agents USING btree (owner_uid);


--
-- Name: idx_ai_logs_flow_id; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_ai_logs_flow_id ON public.ai_execution_logs USING btree (flow_id);


--
-- Name: idx_ai_logs_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_ai_logs_uid ON public.ai_execution_logs USING btree (uid);


--
-- Name: idx_automation_flows_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_automation_flows_uid ON public.automation_flows USING btree (uid);


--
-- Name: idx_broadcast_id; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_broadcast_id ON public.broadcast USING btree (broadcast_id);


--
-- Name: idx_broadcast_log_bid_status; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_broadcast_log_bid_status ON public.broadcast_log USING btree (broadcast_id, delivery_status);


--
-- Name: idx_broadcast_log_meta_msg_id; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_broadcast_log_meta_msg_id ON public.broadcast_log USING btree (meta_msg_id);


--
-- Name: idx_broadcast_log_uid_bid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_broadcast_log_uid_bid ON public.broadcast_log USING btree (uid, broadcast_id);


--
-- Name: idx_broadcast_log_uid_created_at; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_broadcast_log_uid_created_at ON public.broadcast_log USING btree (uid, created_at);


--
-- Name: idx_broadcast_log_uid_updated_at; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_broadcast_log_uid_updated_at ON public.broadcast_log USING btree (uid, updated_at);


--
-- Name: idx_broadcast_status; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_broadcast_status ON public.broadcast USING btree (status);


--
-- Name: idx_broadcast_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_broadcast_uid ON public.broadcast USING btree (uid);


--
-- Name: idx_broadcast_uid_created_at; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_broadcast_uid_created_at ON public.broadcast USING btree (uid, created_at);


--
-- Name: idx_broadcast_uid_schedule; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_broadcast_uid_schedule ON public.broadcast USING btree (uid, schedule);


--
-- Name: idx_channel_connections_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_channel_connections_uid ON public.channel_connections USING btree (uid);


--
-- Name: idx_channel_credentials_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_channel_credentials_uid ON public.channel_credentials USING btree (uid);


--
-- Name: idx_channel_incoming_queue_state; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_channel_incoming_queue_state ON public.channel_incoming_queue USING btree (state);


--
-- Name: idx_channel_incoming_queue_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_channel_incoming_queue_uid ON public.channel_incoming_queue USING btree (uid);


--
-- Name: idx_channel_metrics_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_channel_metrics_uid ON public.channel_metrics USING btree (uid);


--
-- Name: idx_channel_outgoing_queue_state; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_channel_outgoing_queue_state ON public.channel_outgoing_queue USING btree (state);


--
-- Name: idx_channel_outgoing_queue_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_channel_outgoing_queue_uid ON public.channel_outgoing_queue USING btree (uid);


--
-- Name: idx_channel_settings_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_channel_settings_uid ON public.channel_settings USING btree (uid);


--
-- Name: idx_chat_tags_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_chat_tags_uid ON public.chat_tags USING btree (uid);


--
-- Name: idx_chat_widget_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_chat_widget_uid ON public.chat_widget USING btree (uid);


--
-- Name: idx_chatbot_active; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_chatbot_active ON public.chatbot USING btree (uid, active);


--
-- Name: idx_chatbot_log_uid_chatbot; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_chatbot_log_uid_chatbot ON public.chatbot_log USING btree (uid, chatbot_id);


--
-- Name: idx_chatbot_log_uid_created_at; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_chatbot_log_uid_created_at ON public.chatbot_log USING btree (uid, created_at DESC);


--
-- Name: idx_chatbot_log_uid_status; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_chatbot_log_uid_status ON public.chatbot_log USING btree (uid, status);


--
-- Name: idx_chatbot_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_chatbot_uid ON public.chatbot USING btree (uid);


--
-- Name: idx_chats_last_message_came; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_chats_last_message_came ON public.chats USING btree (last_message_came);


--
-- Name: idx_chats_status; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_chats_status ON public.chats USING btree (uid, chat_status);


--
-- Name: idx_chats_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_chats_uid ON public.chats USING btree (uid);


--
-- Name: idx_contact_mobile; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_contact_mobile ON public.contact USING btree (mobile);


--
-- Name: idx_contact_phonebook_id; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_contact_phonebook_id ON public.contact USING btree (phonebook_id);


--
-- Name: idx_contact_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_contact_uid ON public.contact USING btree (uid);


--
-- Name: idx_contact_uid_phonebook_id; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_contact_uid_phonebook_id ON public.contact USING btree (uid, phonebook_id);


--
-- Name: idx_dead_letter_created; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_dead_letter_created ON public.channel_dead_letter_queue USING btree (created_at);


--
-- Name: idx_dead_letter_provider_msg_id; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_dead_letter_provider_msg_id ON public.channel_dead_letter_queue USING btree (provider_message_id);


--
-- Name: idx_flow_data_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_flow_data_uid ON public.flow_data USING btree (uid);


--
-- Name: idx_flow_execution_logs_exec; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_flow_execution_logs_exec ON public.flow_execution_logs USING btree (execution_id);


--
-- Name: idx_flow_executions_uid_flow; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_flow_executions_uid_flow ON public.flow_executions USING btree (uid, flow_id);


--
-- Name: idx_flow_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_flow_uid ON public.flow USING btree (uid);


--
-- Name: idx_flow_versions_uid_flow; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_flow_versions_uid_flow ON public.automation_flow_versions USING btree (uid, flow_id);


--
-- Name: idx_incoming_provider_msg_id; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_incoming_provider_msg_id ON public.channel_incoming_queue USING btree (provider_message_id);


--
-- Name: idx_incoming_state; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_incoming_state ON public.channel_incoming_queue USING btree (state, created_at);


--
-- Name: idx_instagram_api_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_instagram_api_uid ON public.instagram_api USING btree (uid);


--
-- Name: idx_instance_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_instance_uid ON public.instance USING btree (uid);


--
-- Name: idx_kb_chunks_embedding_vector; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_kb_chunks_embedding_vector ON public.knowledge_base_chunks USING hnsw (embedding_vector public.vector_cosine_ops);


--
-- Name: idx_kb_chunks_kb_id; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_kb_chunks_kb_id ON public.knowledge_base_chunks USING btree (kb_id);


--
-- Name: idx_kb_chunks_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_kb_chunks_uid ON public.knowledge_base_chunks USING btree (uid);


--
-- Name: idx_kb_status; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_kb_status ON public.knowledge_base USING btree (status);


--
-- Name: idx_meta_templet_media_name; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_meta_templet_media_name ON public.meta_templet_media USING btree (templet_name);


--
-- Name: idx_orders_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_orders_uid ON public.orders USING btree (uid);


--
-- Name: idx_outgoing_correlation; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_outgoing_correlation ON public.channel_outgoing_queue USING btree (correlation_id);


--
-- Name: idx_outgoing_provider_msg_id; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_outgoing_provider_msg_id ON public.channel_outgoing_queue USING btree (provider_message_id);


--
-- Name: idx_outgoing_state_priority; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_outgoing_state_priority ON public.channel_outgoing_queue USING btree (state, priority DESC, created_at);


--
-- Name: idx_phonebook_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_phonebook_uid ON public.phonebook USING btree (uid);


--
-- Name: idx_plan_is_trial; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_plan_is_trial ON public.plan USING btree (is_trial);


--
-- Name: idx_rooms_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_rooms_uid ON public.rooms USING btree (uid);


--
-- Name: idx_templets_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_templets_uid ON public.templets USING btree (uid);


--
-- Name: idx_webhook_logs_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_webhook_logs_uid ON public.webhook_logs USING btree (uid);


--
-- Name: idx_webhook_rules_active; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_webhook_rules_active ON public.webhook_rules USING btree (uid, active);


--
-- Name: idx_webhook_rules_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_webhook_rules_uid ON public.webhook_rules USING btree (uid);


--
-- Name: idx_whatsapp_forms_uid; Type: INDEX; Schema: public; Owner: b1gcrm
--

CREATE INDEX idx_whatsapp_forms_uid ON public.whatsapp_forms USING btree (uid);


--
-- Name: channel_incoming_queue notify_channel_incoming_queue_insert_trigger; Type: TRIGGER; Schema: public; Owner: b1gcrm
--

CREATE TRIGGER notify_channel_incoming_queue_insert_trigger AFTER INSERT ON public.channel_incoming_queue FOR EACH ROW EXECUTE FUNCTION public.notify_channel_incoming_queue_insert();


--
-- Name: channel_outgoing_queue notify_channel_outgoing_queue_insert_trigger; Type: TRIGGER; Schema: public; Owner: b1gcrm
--

CREATE TRIGGER notify_channel_outgoing_queue_insert_trigger AFTER INSERT ON public.channel_outgoing_queue FOR EACH ROW EXECUTE FUNCTION public.notify_channel_outgoing_queue_insert();


--
-- Name: automation_edges automation_edges_flow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_edges
    ADD CONSTRAINT automation_edges_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.automation_flows(flow_id) ON DELETE CASCADE;


--
-- Name: automation_flow_version_metrics automation_flow_version_metrics_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_flow_version_metrics
    ADD CONSTRAINT automation_flow_version_metrics_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.automation_flow_versions(id) ON DELETE CASCADE;


--
-- Name: automation_flow_versions automation_flow_versions_environment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_flow_versions
    ADD CONSTRAINT automation_flow_versions_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES public.environments(id) ON DELETE SET NULL;


--
-- Name: automation_nodes automation_nodes_flow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.automation_nodes
    ADD CONSTRAINT automation_nodes_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.automation_flows(flow_id) ON DELETE CASCADE;


--
-- Name: crm_lead_activities crm_lead_activities_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.crm_lead_activities
    ADD CONSTRAINT crm_lead_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE CASCADE;


--
-- Name: crm_lead_reminders crm_lead_reminders_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.crm_lead_reminders
    ADD CONSTRAINT crm_lead_reminders_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE CASCADE;


--
-- Name: flow_execution_logs flow_execution_logs_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_execution_logs
    ADD CONSTRAINT flow_execution_logs_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.flow_executions(id) ON DELETE CASCADE;


--
-- Name: flow_executions flow_executions_flow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_executions
    ADD CONSTRAINT flow_executions_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES public.automation_flows(flow_id) ON DELETE CASCADE;


--
-- Name: flow_templates flow_templates_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.flow_templates
    ADD CONSTRAINT flow_templates_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.automation_flow_versions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: b1gcrm
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: b1gcrm
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict coqCfRSCm2gadZtQkO9ftmHMPuqS4TQUgxzegUImmh21kAn06Pl1XyYRj6N0gjb

