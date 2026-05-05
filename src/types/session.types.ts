/**
 * Session config published to the `session/config` MQTT topic before a
 * mission starts. The processor consumes this to know which event,
 * mission, and task mapping is active. If no config is published, the
 * processor falls back to an unassigned default.
 *
 * `rov_id` lives on the event because an event pins a specific ROV.
 */
export interface SessionEvent {
  id: string;
  name: string;
  rov_id: string;
}

export interface SessionMission {
  id: string;
  name: string;
}

export interface SessionTaskAssignment {
  id: string;
  name: string;
  assigned_to: string;
}

export interface SessionConfig {
  event: SessionEvent;
  mission: SessionMission;
  tasks: SessionTaskAssignment[];
  published_at: string;
}
