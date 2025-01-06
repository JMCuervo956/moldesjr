//export const port = 3000

// se debe validar si estamos recibiendo variable de Entorno en la nuebe

export const PORT = process.env.PORT || 3000

// si se tiene variable de entorno se toma PORT, sino 3000

export const DB_HOST = process.env.DB_HOST || 'localhost' //'192.168.1.9' //'192.168.56.1' // 
export const DB_USER = process.env.DB_USER || 'root'
export const DB_PASSWORD = process.env.DB_PASSWORD || '123'
export const DB_NAME = process.env.DB_NAME || 'sarlaft'
export const DB_PORT = process.env.DB_PORT || '3306'