# Run this script as Administrator to register the scheduled task

$TaskName = "SMUCourses AutoSync"
$ScriptPath = "X:\01 REPOSITORIES\smucourses\scripts\auto_sync.ps1"

Write-Host "Registering Windows Task Scheduler Job: $TaskName"

# Create action to run the powershell script hidden
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""

# Create trigger to run daily at 2:00 AM
$Trigger = New-ScheduledTaskTrigger -Daily -At "2:00AM"

# Register the task
try {
    Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName $TaskName -Description "Runs the SMU Courses data pipeline every night to fetch latest XML data, sync PDFs, and push to Vercel." -Force
    Write-Host "✅ Successfully registered! Your PC will now automatically run the sync every day at 2:00 AM in the background."
} catch {
    Write-Host "❌ Failed to register task. Make sure you are running this PowerShell terminal as Administrator."
}
