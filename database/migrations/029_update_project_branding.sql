-- Migration 029: Update project branding to OMNI CRM
UPDATE web_public
SET app_name = 'OMNI CRM'
WHERE app_name IN ('B1G CRM', 'WhatsCRm', 'whatsCRM', 'B1GCRM') OR app_name IS NULL;
