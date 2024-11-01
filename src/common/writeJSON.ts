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
    let filePath = path.resolve(process.cwd(), output);
    if (path.extname(output).toLowerCase() == '') {
      filePath = path.join(
        filePath,
        `${new Date().toISOString().replace(/[:.]/g, '-')}-${name}.json`
      );
    } else {
      filePath = path.join(
        path.dirname(filePath),
        path.basename(filePath).replace(/\.[^.]+$/, '.json')
      );
      if (fs.existsSync(filePath)) {
        filePath = path.join(
          path.dirname(filePath),
          `${path.basename(filePath, '.json')}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
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
