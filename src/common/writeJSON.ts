import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';

export default function writeJSON(
  output: string,
  data: object,
  { pretty = false, name = 'output' } = {}
) {
  const spinner = cli.spinner();
  if (output) {
    spinner.start('Writing output to file');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    output = output.replace('%TIMESTAMP%', timestamp);
    let filePath = path.resolve(process.cwd(), output);
    if (path.extname(output).toLowerCase() == '') {
      filePath = path.join(filePath, `${timestamp}-${name}.json`);
    } else {
      filePath = path.join(
        path.dirname(filePath),
        path.basename(filePath).replace(/\.[^.]+$/, '.json')
      );
      if (fs.existsSync(filePath)) {
        filePath = path.join(
          path.dirname(filePath),
          `${path.basename(filePath, '.json')}-${timestamp}.json`
        );
      }
    }
    fs.writeFileSync(
      filePath,
      pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
    );
    spinner.succeed(`Wrote ${cli.colors.url(filePath)}`);
  } else {
    cli.log.info(data);
  }
}
