export function generateBoardUUID() {
    let uuid = crypto.randomUUID();
    const prefix = "board-";
    const length = 8;
    
    uuid = prefix + uuid.replace(/-/g, "").slice(0, length);
    
    return uuid;
  }

  export function generateCardUUID() {
    let uuid = crypto.randomUUID();
    const prefix = "cd-";
    const length = 12;
    
    uuid = prefix + uuid.replace(/-/g, "").slice(0, length);
    
    return uuid;
  }
  