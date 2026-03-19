$ErrorActionPreference = "Stop"
$env:FIREBASE_TOKEN="1//0gjVOp2tsXTEYCgYIARAAGBASNwF-L9Irn6GZwver_NKgWjXhbbz_KhuJI9QTdbvckPc-s69FMFIhtjsqcWaQXa9j8bib8yMhloY"
$projectId="ticketing-app-9975"

Write-Host "Creating Project..."
firebase projects:create $projectId --display-name "Ticketing System" --non-interactive

Write-Host "Creating Web App..."
$appConfig = firebase apps:create web TicketApp --project $projectId --non-interactive | Out-String

Write-Host "Fetching SDK Config..."
firebase apps:sdkconfig web --out config.json --project $projectId --non-interactive
