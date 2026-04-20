import { useMemo, useState } from 'react';
import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { MainContentLayout } from '../../layouts/MainContentLayout';
import VerticalPageContentLayout from '../../layouts/VerticalPageContentLayout/VerticalPageContentLayout';
import HorizontalPageContentLayout from '../../layouts/HorizontalPageContentLayout/HorizontalPageContentLayout';
import { TextInput } from '../../components/Inputs/TextInput';
import { FlexibleDataGrid } from '../../components/Inputs/FlexibleDataGrid';
import type { GridColDef, GridRenderCellParams, GridValidRowModel } from '@mui/x-data-grid';
import { useMqtt } from '../../hooks/useMqtt';
import { publishSessionConfig } from '../../utils/mqttClient';
import type {
  SessionConfig,
  SessionEvent,
  SessionMission,
  SessionTaskAssignment,
} from '../../types';

type TaskRow = SessionTaskAssignment & { rowId: string };

const emptyEvent: SessionEvent = { id: '', name: '', rov_id: '' };
const emptyMission: SessionMission = { id: '', name: '' };

const newTaskRow = (): TaskRow => ({
  rowId: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  id: '',
  name: '',
  assigned_to: '',
});

type PublishState =
  | { kind: 'idle' }
  | { kind: 'publishing' }
  | { kind: 'success'; at: string }
  | { kind: 'error'; message: string };

const SessionConfigContent = () => {
  const mqtt = useMqtt();
  const connected = mqtt?.connected ?? false;

  const [event, setEvent] = useState<SessionEvent>(emptyEvent);
  const [mission, setMission] = useState<SessionMission>(emptyMission);
  const [tasks, setTasks] = useState<TaskRow[]>([newTaskRow()]);
  const [publishState, setPublishState] = useState<PublishState>({ kind: 'idle' });

  const updateEvent = (field: keyof SessionEvent, value: string) =>
    setEvent((prev) => ({ ...prev, [field]: value }));

  const updateMission = (field: keyof SessionMission, value: string) =>
    setMission((prev) => ({ ...prev, [field]: value }));

  const addTaskRow = () => setTasks((prev) => [...prev, newTaskRow()]);

  const removeTaskRow = (rowId: string) =>
    setTasks((prev) => (prev.length === 1 ? prev : prev.filter((t) => t.rowId !== rowId)));

  const handleRowUpdate = (newRow: GridValidRowModel) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.rowId === newRow.rowId
          ? {
              ...t,
              id: String(newRow.id ?? ''),
              name: String(newRow.name ?? ''),
              assigned_to: String(newRow.assigned_to ?? ''),
            }
          : t,
      ),
    );
    return newRow;
  };

  const validationError = useMemo(() => {
    if (!event.id.trim() || !event.name.trim() || !event.rov_id.trim()) {
      return 'Event id, name, and ROV id are required.';
    }
    if (!mission.id.trim() || !mission.name.trim()) {
      return 'Mission id and name are required.';
    }
    const hasBlankTask = tasks.some((t) => !t.id.trim() || !t.name.trim());
    if (hasBlankTask) {
      return 'Every task row needs an id and name (remove empty rows).';
    }
    return null;
  }, [event, mission, tasks]);

  const handlePublish = async () => {
    if (validationError) return;
    const payload: SessionConfig = {
      event,
      mission,
      tasks: tasks.map(({ id, name, assigned_to }) => ({ id, name, assigned_to })),
      published_at: new Date().toISOString(),
    };
    setPublishState({ kind: 'publishing' });
    try {
      await publishSessionConfig(payload);
      setPublishState({ kind: 'success', at: payload.published_at });
    } catch (err) {
      setPublishState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Publish failed',
      });
    }
  };

  const taskColumns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Task ID',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
    {
      field: 'name',
      headerName: 'Task Name',
      flex: 2,
      editable: true,
      headerClassName: 'bold-header',
    },
    {
      field: 'assigned_to',
      headerName: 'Assigned To',
      flex: 1,
      editable: true,
      headerClassName: 'bold-header',
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      editable: false,
      renderCell: (params: GridRenderCellParams<TaskRow>) => (
        <IconButton
          aria-label="Remove task"
          size="small"
          onClick={() => removeTaskRow(params.row.rowId)}
          disabled={tasks.length === 1}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const publishDisabled = !connected || !!validationError || publishState.kind === 'publishing';

  return (
    <Box sx={{ padding: 2 }}>
      <HorizontalPageContentLayout>
        <VerticalPageContentLayout>
          <Typography variant="h6">Event</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <TextInput label="Event ID" value={event.id} onChange={(v) => updateEvent('id', v)} />
            <TextInput
              label="Event Name"
              value={event.name}
              onChange={(v) => updateEvent('name', v)}
            />
            <TextInput
              label="ROV ID"
              value={event.rov_id}
              onChange={(v) => updateEvent('rov_id', v)}
            />
          </Stack>
          <Typography variant="h6" sx={{ mt: 1 }}>
            Mission
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <TextInput
              label="Mission ID"
              value={mission.id}
              onChange={(v) => updateMission('id', v)}
            />
            <TextInput
              label="Mission Name"
              value={mission.name}
              onChange={(v) => updateMission('name', v)}
            />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Button variant="contained" onClick={handlePublish} disabled={publishDisabled}>
              {publishState.kind === 'success'
                ? 'Re-publish Session Config'
                : 'Publish Session Config'}
            </Button>
            {!connected && (
              <Typography variant="body2" color="warning.main">
                Broker disconnected — publish will be enabled once reconnected.
              </Typography>
            )}
          </Stack>
          {validationError && publishState.kind !== 'publishing' && (
            <Alert severity="info" variant="outlined">
              {validationError}
            </Alert>
          )}
          {publishState.kind === 'success' && (
            <Alert severity="success" variant="outlined">
              Published at {new Date(publishState.at).toLocaleTimeString()}. Edit and press the
              button again to re-publish mid-session.
            </Alert>
          )}
          {publishState.kind === 'error' && (
            <Alert severity="error" variant="outlined">
              Publish failed: {publishState.message}
            </Alert>
          )}
        </VerticalPageContentLayout>
        <VerticalPageContentLayout>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Task Mapping</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addTaskRow}>
              Add Task
            </Button>
          </Stack>
          <FlexibleDataGrid
            data={tasks.map((t) => ({ ...t, id: t.id, rowId: t.rowId }))}
            columns={taskColumns}
            onProcessRowUpdate={handleRowUpdate}
          />
        </VerticalPageContentLayout>
      </HorizontalPageContentLayout>
    </Box>
  );
};

export const SessionConfigPage = () => (
  <MainContentLayout name="Session Config">
    <SessionConfigContent />
  </MainContentLayout>
);
