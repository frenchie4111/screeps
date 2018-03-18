test:
	webpack
	grunt screeps --config=./.screeps-ps.json --src="dist/test/*"

deploy_ps:
	webpack
	grunt screeps --config=./.screeps-ps.json --src="dist/main/*"
