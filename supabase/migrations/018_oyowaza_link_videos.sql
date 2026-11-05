-- 018: привязка роликов «Иккаджо Оё-вадза», загруженных 05.11.2026
--
-- Ролики загрузились в Kinescope, но из-за ошибки админки (сохранение раздела
-- затирало video_id) не привязались к разделам. Пишем только в пустые поля.
-- Безопасно запускать повторно.

UPDATE course_videos AS cv SET
  video_id       = COALESCE(cv.video_id, m.main),
  video_status   = CASE WHEN cv.video_id IS NULL AND m.main IS NOT NULL THEN 'ready' ELSE cv.video_status END,
  video_provider = 'kinescope',
  errors_video_id     = COALESCE(cv.errors_video_id, m.errs),
  errors_video_status = CASE WHEN cv.errors_video_id IS NULL AND m.errs IS NOT NULL THEN 'ready' ELSE cv.errors_video_status END
FROM (VALUES
  ('Курумадаоси', 'от бокового удара рукой', NULL,                                   'f6fe09ec-03a3-48c2-91e5-1c3fd59caab0'),
  ('Курумадаоси', 'от прямого удара рукой',  '6e191743-d720-4c15-b17d-8c67ad022546', '92fa2ad4-b6ab-46e6-b29d-b63081c6149c'),
  ('Косигурума',  NULL,                      'd6291b9c-ff86-471c-8efe-9ac0b9353ce6', NULL),
  ('Караминагэ',  NULL,                      'ce154128-300b-4081-9077-5ef3e63c10fa', 'a78cc9ee-d811-42af-a798-8cbcdc4e5f8f'),
  ('Ураотоси',    NULL,                      '1ad5fc92-bf71-4533-a6ec-c96e29dc86cb', 'eec07671-bc1a-48b7-8d39-1cc077298535'),
  ('Обиотоси',    NULL,                      '600c81ce-7ea9-4a03-b48e-7d631db84031', 'e9035e96-6158-459b-b232-e9d00eea1eb9'),
  ('Кирикаэси',   'от прямого удара рукой',  '58785b7f-f2d7-4890-b973-590861381bc4', '67842461-ff19-439d-819a-b8b73d3e441b'),
  ('Кирикаэси',   'от прямого удара ногой',  '4f97bcf9-a4e4-40ef-95e8-0e93675852a7', '45e6e4d9-2190-4c29-a0ae-8eb9fb7c5251'),
  ('Сихонагэ',    'от бокового удара рукой', 'dda604d9-07ec-418b-a178-b6177d50fd19', 'cefdc56b-250b-4526-b6d3-4bc862a2754a'),
  ('Сихонагэ',    'от прямого удара рукой',  NULL,                                   'c67a49ee-eda5-4290-af42-9f4da12df089'),
  ('Заключение',  NULL,                      '9c0d6346-917b-4d2d-9d54-9fe6735e0a11', NULL)
) AS m(title, subtitle, main, errs)
WHERE cv.course_id = 'ikkajo-oyowaza'
  AND cv.title = m.title
  AND (m.subtitle IS NULL OR cv.subtitle = m.subtitle);
