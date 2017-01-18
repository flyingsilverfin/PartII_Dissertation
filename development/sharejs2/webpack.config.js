var webpack = require('webpack');


module.exports = {	
	entry: [
		'webpack-dev-server/client?http://localhost:9000',
		'./src/index.ts'
	],
	output: {
		path: __dirname + '/dist',
		publicPath: '/',
		filename: 'bundle.js'
	},
	resolve: {
		extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
	},
	module: {
		loaders: [
			{ test: /\.tsx?$/, loader: 'babel-loader!ts-loader', exclude: ['/node_modules/', '/simulation/'] }
		]
	},
	devServer: {
		contentBase: './dist',
		port: 9000
	},
	// Turn on sourcemaps
	devtool: 'source-map',
	resolve: {
		extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
	}
}
