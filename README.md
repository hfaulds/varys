# Varys

Share your secrets publicly and securely. Use Varys to GPG encrypt a secret for multiple users, just check in their public key.

## Usage

Set a repo up with a secret you want to share (in this case `test_secret`) and add this workflow file:

```
name: Varys
on:
  push:
    paths:
    - "test/publickeys/*"

jobs:
  varys:
    name: Varys
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Run Varys
        uses: hfaulds/varys@master
        with:
          publicKeyDir: test/publickeys
          secret: ${{ secrets.test_secret }}
          output: test/secret
          githubToken: ${{ secrets.GITHUB_TOKEN }}
```

Create a key (for a further guide see https://help.github.com/en/github/authenticating-to-github/generating-a-new-gpg-key):

```
gpg --full-generate-key
```

Commit your key:

```
gpg --armor --export test@example.com > test/publickeys/example.gpg
```

The Action will now run (it may be advisable to only run this on `master` depending who has access to your repository).

Once the Action has finished it will commit an output file (in this case `test/secret`) which can be decrypted using your private key:

```
gpg --decrypt test/secret
```

## Improvements

This should probably only run after a PR is merged (i.e. there is a change to a protected branch) and may want/need to create a PR instead of just pushing to master.
