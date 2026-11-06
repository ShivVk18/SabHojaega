# {{projectName}}

Generated using Sabhojaega (Go Fiber).

## Requirements
- Go >= 1.20

## Getting Started

Download dependencies:
```bash
go mod tidy
```

Run development server:
```bash
go run main.go
```

Build binary:
```bash
go build -o server main.go
```

## Endpoints
- `GET /`: Welcome message
- `GET /health`: Health check status (`{"status":"healthy"}`)
