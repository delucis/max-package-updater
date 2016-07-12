# Max Package Updater

A module for Max 7 that enables a Max package to check for and install updates.

## WORK IN PROGRESS

See progress [over on issue #1](https://github.com/delucis/max-package-updater/issues/1).

## Specifying a remote `package.json`

### GitHub repositories

By default, Max Package Updater tries to work with [the standard npm `package.json` format](https://docs.npmjs.com/files/package.json), and assumes a remote package is hosted on GitHub.

If the [repository field](https://docs.npmjs.com/files/package.json#repository) in your `package.json` uses one of the standard syntaxes, Max Package Updater should be able synthesise a URL for your remote `package.json` automatically.

```json
{
  "repository": "delucis/max-package-updater"
}
```
```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/delucis/max-package-updater.git"
  }
}
```

Both of the above resolve to:

    https://raw.githubusercontent.com/delucis/max-package-updater/master/package.json

**N.B.** Your `package.json` *must* be in the root of your repository.

### Self-hosted

If you want to use an alternative hosting mechanism, and want to specify the precise URL of your remote `package.json`, you can do so in [the `config` section](https://docs.npmjs.com/files/package.json#config) of your `package.json`:

```json
{
  "config": {
    "mpu": {
      "package-info": "http://www.myhome.eu/package.json"
    }
  }
}
```

A `package-info` field takes precedence over a `repository` field, so if you include one, the `repository` field will be ignored.
