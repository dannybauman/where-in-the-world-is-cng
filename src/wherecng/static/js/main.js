import { home, notebook } from "./home.js";
import { countNotes } from "./notes.js";

document.getElementById("home-btn").onclick = home;
document.getElementById("nb-btn").onclick = notebook;
countNotes();
home();
