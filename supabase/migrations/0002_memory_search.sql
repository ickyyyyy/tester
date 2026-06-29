-- RPC for cosine-similarity memory search
create or replace function match_memory_chunks(
  query_embedding vector(1536),
  match_count int,
  p_user_id text
)
returns table (
  id uuid,
  text text,
  source_type text,
  source_id text,
  created_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    mc.id,
    mc.text,
    mc.source_type,
    mc.source_id,
    mc.created_at,
    1 - (mc.embedding <=> query_embedding) as similarity
  from memory_chunks mc
  where mc.user_id = p_user_id
  order by mc.embedding <=> query_embedding
  limit match_count;
end;
$$;
