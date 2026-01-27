-- Add message_sent column to track what was actually sent
alter table sequence_step_executions 
add column if not exists message_sent text;

-- Add index for querying previous messages
create index if not exists sequence_step_executions_enrollment_id_idx 
on sequence_step_executions(enrollment_id, created_at);

-- Add comment
comment on column sequence_step_executions.message_sent is 'The actual message that was sent (AI-generated or template)';
