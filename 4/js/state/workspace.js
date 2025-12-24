export const workspace = {
  open: [],     // открытые инструкции (dock)
  active: null, // текущая инструкция (модалка)
  history: []   // история просмотров
};


const KEY = 'workspace-state';

export function saveWorkspace(){
  localStorage.setItem(KEY, JSON.stringify(workspace));
}

export function loadWorkspace(){
  const raw = localStorage.getItem(KEY);
  if (!raw) return;
  try{
    const data = JSON.parse(raw);
    Object.assign(workspace, data);
  }catch{}
}
