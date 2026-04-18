import fs from 'fs-extra';
const target = 'c:/Users/carle/Desktop/Sogna/Sogna/Sognatore/resources/skills/awesome-vault';
try {
    if (fs.existsSync(target)) {
        fs.removeSync(target);
        console.log('✔ Puente eliminado físicamente.');
    }
} catch (e) {
    console.error('✘ Error:', e.message);
}
