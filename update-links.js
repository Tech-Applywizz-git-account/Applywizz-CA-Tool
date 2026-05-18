const fs = require('fs');

const files = [
  'app/components/cro-dashboard.tsx',
  'app/components/ceo-dashboard.tsx',
  'app/components/coo-dashboard.tsx',
  'app/components/cpo-dashboard.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace `{ teamId: selectedTeamId } : {}`
  content = content.replace(
    /query:\s*(selectedTeamId|selectedTeam !== "all")\s*\?\s*\{\s*teamId:\s*(selectedTeamId|selectedTeam)\s*\}\s*:\s*\{\s*\}/g, 
    'query: $1 ? { teamId: $2, from: dateFrom, to: dateTo } : { from: dateFrom, to: dateTo }'
  );

  // Replace `{ teamId: selectedTeamId, active: "active" } : { active: "active" }`
  content = content.replace(
    /query:\s*(selectedTeamId|selectedTeam !== "all")\s*\?\s*\{\s*teamId:\s*(selectedTeamId|selectedTeam),\s*([^}]+)\s*\}\s*:\s*\{\s*([^}]+)\s*\}/g,
    'query: $1 ? { teamId: $2, $3, from: dateFrom, to: dateTo } : { $4, from: dateFrom, to: dateTo }'
  );
    
  fs.writeFileSync(file, content);
  console.log('Processed', file);
});
