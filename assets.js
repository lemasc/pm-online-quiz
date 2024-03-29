const fs = require("fs");
const path = require("path");
const mime = require("mime");

function main() {
  const output = new Map();
  const assets = fs.readdirSync("./statics/raw");
  assets.map((file) => {
    const data = fs.readFileSync(path.join("./statics/raw", file));
    const parsed = path.parse(file);
    output.set(parsed.name, data.toJSON().data);
  });
  fs.writeFileSync(
    "./statics/index.json",
    JSON.stringify(Object.fromEntries(output.entries()))
  );
}

main();
