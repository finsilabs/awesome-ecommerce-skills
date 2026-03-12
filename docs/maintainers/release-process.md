# Release Process

1. Ensure all skills validate: `npm run validate:strict`
2. Regenerate catalog: `npm run chain`
3. Update `CHANGELOG.md` with new skills and changes
4. Bump version in `package.json`
5. Commit: `git commit -m "release: vX.Y.Z"`
6. Tag: `git tag vX.Y.Z`
7. Push: `git push && git push --tags`
