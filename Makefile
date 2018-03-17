test:
	webpack --target=node --output-path=test_build
	mocha --require=mocha_globals.js test_build/

deploy_ps:
	webpack
	grunt screeps --config=./.screeps-ps.json
