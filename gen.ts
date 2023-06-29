import ts from 'npm:ts-morph';
import { camelCase } from 'npm:change-case';
import * as t from 'npm:runtypes';
import * as fs from 'https://deno.land/std@0.175.0/fs/mod.ts';
import * as path from 'https://deno.land/std@0.175.0/path/mod.ts';

const project = new ts.Project();
const sf = project.createSourceFile('models.ts', '', { overwrite: true });

// Models
const Model = t.Record({
  collectionName: t.String,
});

const models: { content: unknown, name: string, path: string }[] = [];
for await (const entry of fs.expandGlobSync(`${Deno.args[0]}/api/*/models/*.settings.json`)) {
  models.push({
    content: JSON.parse(await Deno.readTextFile(entry.path)),
    name: entry.path.split(path.SEP_PATTERN).at(-3) ?? '',
    path: entry.path,
  });
}

for (const model of models) {
  sf.addVariableStatement({
    isExported: true,
    declarationKind: ts.VariableDeclarationKind.Const,
    declarations: [{
      name: camelCase(model.name),
      initializer: JSON.stringify(model.content, null, 2) + ' as const',
    }],
  });
}

sf.addVariableStatement({
  isExported: true,
  declarationKind: ts.VariableDeclarationKind.Const,
  declarations: [{
    name: 'models',
    initializer: '{' + models.map(model => `'${model.name}': ${camelCase(model.name)},`).join('\n') + '}',
  }],
});

sf.addTypeAlias({
  name: 'Model',
  isExported: true,
  type: 'typeof models[keyof typeof models]',
});

// Components
const components: { content: unknown, group: string, componentName: string, name: string, path: string }[] = [];
for await (const entry of fs.expandGlobSync(`${Deno.args[0]}/components/*/*.json`)) {
  const p = path.parse(entry.path);
  components.push({
    content: JSON.parse(await Deno.readTextFile(entry.path)),
    group: path.basename(p.dir),
    componentName: '',
    name: p.name,
    path: entry.path,
  });
}

for (const component of components) {
  let collectionName: string;
  try {
    ({ collectionName } = Model.check(component.content));
  } catch (cause) {
    throw new Error(`Failed to parse ${component.path}`, { cause });
  }
  component.componentName = camelCase(collectionName);
  sf.addVariableStatement({
    isExported: true,
    declarationKind: ts.VariableDeclarationKind.Const,
    declarations: [{
      name: component.componentName,
      initializer: JSON.stringify(component.content, null, 2) + ' as const',
    }],
  });
}

sf.addVariableStatement({
  isExported: true,
  declarationKind: ts.VariableDeclarationKind.Const,
  declarations: [{
    name: 'components',
    initializer: '{' + components.map(component => `'${component.group}.${component.name}': ${component.componentName},`).join('\n') + '}',
  }],
});

sf.addTypeAlias({
  name: 'Component',
  isExported: true,
  type: 'typeof components[keyof typeof components]',
});

sf.formatText({ indentSize: 2 });
sf.save();

console.log(`${models.length} models and ${components.length} components are imported and saved to models.ts.`);
