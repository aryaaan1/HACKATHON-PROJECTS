import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.seed_data import seed_if_empty
from backend.routes import dashboard, products, locations, orders, stock, auth

app = FastAPI(title="Inventory Management System")

# FRONTEND_ORIGIN can be a single origin or a comma-separated list
# (e.g. "https://app.vercel.app,http://localhost:5173").
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(products.router)
app.include_router(locations.router)
app.include_router(orders.router)
app.include_router(stock.router)

@app.on_event("startup")
def startup_event():
    seed_if_empty()

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
