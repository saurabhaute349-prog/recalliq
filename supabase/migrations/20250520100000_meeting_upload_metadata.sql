-- Transcript upload metadata on meetings

alter table public.meetings
  add column if not exists original_filename text,
  add column if not exists upload_type text,
  add column if not exists transcript_raw text,
  add column if not exists duration_seconds integer,
  add column if not exists uploaded_at timestamptz;

comment on column public.meetings.original_filename is 'Source file name when uploaded';
comment on column public.meetings.upload_type is 'txt | pdf | docx | srt | vtt | zoom | meet | otter | fireflies | paste | audio';
comment on column public.meetings.transcript_raw is 'Extracted text before final cleaning';
comment on column public.meetings.duration_seconds is 'Estimated duration from timestamps when available';
