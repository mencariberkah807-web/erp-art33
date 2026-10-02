-- Dashboard access is explicitly granted through the dynamic permission model.
INSERT INTO permissions (code, name)
VALUES ('DASHBOARD_VIEW', 'Dashboard - View')
ON CONFLICT (code) DO NOTHING;

-- Owner retains access to the dashboard.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'OWNER'
  AND p.code = 'DASHBOARD_VIEW'
ON CONFLICT DO NOTHING;
