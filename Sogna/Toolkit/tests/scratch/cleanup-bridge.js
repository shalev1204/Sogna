import fs from 'fs-extra';
import path from 'path';

const junctionPath = 'c:/Users/carle/Desktop/Sogna/Sogna/Sognatore/resources/skills/awesome-vault';

async function removeJunction() {
    try {
        if (fs.existsSync(junctionPath)) {
            await fs.remove(junctionPath);
            console.log('✔ Puente eliminado con éxito usando fs-extra.');
        } else {
            console.log('ℹ El puente ya no existe.');
        }
    } catch (err) {
        console.error('✘ Error al eliminar el puente:', err.message);
    }
}

removeJunction();
