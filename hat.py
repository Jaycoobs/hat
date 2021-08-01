import json
import random
import sched
from fastapi import Body, FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

hats = {}
nextSaveEvent = None
scheduler = sched.scheduler()

app = FastAPI()
api = FastAPI();

app.mount("/web", StaticFiles(directory="web"), name="static")
app.mount("/api", api)

def loadHats():
    try:
        with open("hats.json") as f:
            hats = json.loads(f.read())
        return hats
    except FileNotFoundError:
        return {}

def saveHats(hats):
    with open("hats.json", "w") as f:
        f.write(json.dumps(hats))

def saveHatsAndSchedule(hats, s):
    global nextSaveEvent
    print("Saving hats.")
    saveHats(hats)
    nextSaveEvent = s.enter(3600, 1, saveHatsAndSchedule, (hats, s))
    return nextSaveEvent

@app.on_event("startup")
async def startup_event():
    global hats
    global nextSaveEvent
    hats = loadHats()
    nextSaveEvent = saveHatsAndSchedule(hats, scheduler)

@app.on_event("shutdown")
async def shutdown_event():
    saveHats(hats)

@app.get("/", response_class=RedirectResponse)
async def redirect():
    return "/web/page.html"

@api.post("/create-hat")
def create_hat(name: str = Body(...)):
    if (name in hats):
        raise HTTPException(status_code=409, detail=f"Already a hat called {name}");
    hats[name] = [];

@api.get("/hats")
def get_hats():
    return list(hats.keys())

@api.post("/submit")
def submit(hat: str = Body(...), entry: str = Body(...)):
    if (not hat in hats):
        raise HTTPException(status_code=404, detail=f"No hat named {hat}")
    hats[hat].append(entry)

@api.get("/draw/{hat}")
def draw(hat: str):
    hat = hats[hat]
    if (len(hat) == 0):
        raise HTTPException(status_code=400, detail="This hat is empty!")
    entry = random.choice(hat)
    hat.remove(entry)
    return { "entry": entry }
