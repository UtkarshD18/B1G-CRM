DELETE FROM web_private
WHERE id NOT IN (
  SELECT MIN(id)
  FROM web_private
);
