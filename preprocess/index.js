const fs = require('fs');

const currentFolder = 'pictures'
const picturesFolder = `../fingerpointing/public/${currentFolder}`;
const outputJsonPath = `../fingerpointing/public/${currentFolder}.json`

let output = []

try {
    let jsonContent = fs.readFileSync(outputJsonPath);
    output = JSON.parse(jsonContent);
    console.log('Loaded previous json');
}
catch {
    console.log('Loading failed')
}

fs.readdir(picturesFolder, (err, files) => {
    files.forEach(file => {
        // console.log(files.map(el => el.filename).includes(file))
        if (output.map(el => el.filename).includes(file)) // If contained we ignore it to preserve metadata
            return;
        output.push({
            filename: file
        });
    });
    fs.writeFileSync(outputJsonPath, JSON.stringify(output, null, 2));
});

