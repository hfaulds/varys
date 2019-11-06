const core = require('@actions/core')
const exec = require('@actions/exec')
const fs = require('fs').promises;
const openpgp = require('openpgp');
const path = require('path');

const publicKeyDir = core.getInput('publicKeyDir', { required: true });
const secret = core.getInput('secret', { required: true });
const output = core.getInput('output', { required: true });
const githubToken = core.getInput('githubToken');

async function main() {
	const publicKeyData = await readFiles(publicKeyDir)
	const publicKeys = Promise.all(publicKeyData.map(async (publicKey) => {
		return (await openpgp.key.readArmored(publicKey.data)).keys[0]
	}))

	core.debug('Encrypting secret with ' + publicKeys.size + ' keys');
	const options = {
		publicKeys: await publicKeys,
		message: await openpgp.message.fromText(secret),
	}
	const encrypted = (await openpgp.encrypt(options)).data

	core.debug('Encrypted secret');
	await fs.writeFile(output,  encrypted)

	if (!!githubToken) {
		core.debug('Pushing new secret');
		await exec.exec('git config --global user.email "actions@github.com"')
		await exec.exec('git config --global user.name "Actions"')
		await exec.exec('git add ./' + output)
		await exec.exec('git commit -m "Updated secret ' + output + '"')
		await exec.exec('git push origin HEAD:master')
	}
}
main()

async function readFiles(dirname) {
	const filenames = await fs.readdir(dirname)
	return Promise.all(filenames.map(async (filename) => {
		const data = await fs.readFile(path.join(dirname, filename))
		return { name: filename, data: data.toString() }
	}))
}
