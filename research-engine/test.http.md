# Quick tests (run the server first: npm start)

curl http://localhost:4002/health

curl -X POST http://localhost:4002/research -H "Content-Type: application/json" -d '{"goal":"Build a voice spoof detection system","deadline":"4 days","budget":0,"resources":["Laptop","Google Colab"],"successCriteria":["Good accuracy","Working demo"]}'

# Re-research after a failure
curl -X POST http://localhost:4002/research -H "Content-Type: application/json" -d '{"goal":"Build a voice spoof detection system","deadline":"4 days","budget":0,"resources":["Laptop"],"successCriteria":["Working demo"],"failedStrategy":"AASIST + local training","failureReason":"setup time too high","deadlineRemaining":"18 hours"}'