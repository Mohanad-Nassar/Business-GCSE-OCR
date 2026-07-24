-- ══════════════════════════════════════════════════════════════
-- numeric_answer_correct() — server-side numeric answer comparator (ADM-B B1)
--
-- Shared by ALL FOUR graders (grade_topic_answer / submit_task_attempt /
-- daily-revise / subjects-v2 bank-scope) so a numeric question is marked the
-- same everywhere. It MUST stay byte-identical in behaviour to the client
-- comparator in cs-lab/exam-widgets.js (helpers.numericAnswerCorrect) — change
-- the two together or the live mark diverges from what the student saw.
--
-- Contract (mirrors the JS):
--   normalise(s): lower-case, '√' → 'root', then strip spaces, commas and
--                 the characters £ $ € % .
--   correct if:  normalise(student) equals normalise(any key.accept[])   (exact form)
--            OR  student parses as a plain decimal or an a/b fraction and
--                |value − key.value| ≤ (key.tol, default 0.0005) + 1e-12.
--   A student string that is neither a bare number nor a fraction can only
--   match via the accept[] list (surds, symbolic exact forms).
--
-- key jsonb shape (one entry of answer_key->'numeric'):
--   { "value": 2.45, "tol": 0.005, "accept": ["-3+2root5", "(-6+root80)/2"] }
--
-- RUN THIS FILE before (or with) the four grader migrations — they call this
-- function by name.
-- ══════════════════════════════════════════════════════════════

create or replace function numeric_norm(p_raw text)
returns text language sql immutable as $$
  -- lower → √ to root → strip spaces, commas, £ $ € %
  select regexp_replace(replace(lower(coalesce(p_raw, '')), '√', 'root'), '[[:space:],£$€%]', '', 'g');
$$;

create or replace function numeric_answer_correct(p_raw text, p_key jsonb)
returns boolean language plpgsql immutable as $$
declare
  ns       text;
  a        text;
  target   numeric;
  tol      numeric;
  v        numeric;
  slash    int;
  den      numeric;
begin
  if p_key is null then return false; end if;

  ns := numeric_norm(p_raw);
  if ns = '' then return false; end if;

  -- exact-form accept list (surds / symbolic forms)
  if p_key ? 'accept' then
    for a in select jsonb_array_elements_text(p_key->'accept') loop
      if ns = numeric_norm(a) then return true; end if;
    end loop;
  end if;

  -- numeric value with tolerance
  if (p_key->>'value') is null then return false; end if;
  target := (p_key->>'value')::numeric;
  tol := coalesce((p_key->>'tol')::numeric, 0.0005);

  -- leading '+' deliberately NOT accepted — '+3'::numeric is not portable, and
  -- the client comparator rejects it too. Students type '-3', not '+3'.
  if ns ~ '^-?[0-9]+(\.[0-9]+)?$' then
    v := ns::numeric;
  elsif ns ~ '^-?[0-9]+(\.[0-9]+)?/-?[0-9]+(\.[0-9]+)?$' then
    slash := position('/' in ns);
    den := substring(ns from slash + 1)::numeric;
    if den = 0 then return false; end if;
    v := substring(ns from 1 for slash - 1)::numeric / den;
  else
    return false;  -- not a bare number/fraction — only accept[] could have matched
  end if;

  return abs(v - target) <= tol + 1e-12;
end;
$$;
