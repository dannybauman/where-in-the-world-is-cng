// progress in localStorage; same key and shape as before so existing players keep theirs
export const save = JSON.parse(localStorage.getItem("gt2") || '{"notes":[],"stars":{}}');
export const persist = () => localStorage.setItem("gt2", JSON.stringify(save));
