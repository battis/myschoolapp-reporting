import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';

export default function writeJSON(
  outputPath: string | undefined,
  data: object | undefined,
  { pretty = false, name = 'output' } = {}
) {
  const spinner = cli.spinner();
  if (data) {
    if (outputPath) {
      spinner.start('Writing output to file');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      outputPath = outputPath.replace('%TIMESTAMP%', timestamp);
      let filePath = path.resolve(process.cwd(), outputPath);
      if (path.extname(outputPath).toLowerCase() == '') {
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
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(
        filePath,
        pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
      );
      spinner.succeed(`Wrote ${cli.colors.url(filePath)}`);
    } else {
      cli.log.info(data);
    }
  } else {
    spinner.warn('No data to write');
  }
}
