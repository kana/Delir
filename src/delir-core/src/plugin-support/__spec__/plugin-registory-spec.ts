// @flow
import path from 'path'
import FSPluginLoader from '../FSPluginLoader'

describe('PluginRegistry', () => {
    it('exporting: PluginFeatures', () => {

    it('loading plugins', async () => {
        // mock missing method in mocha

        const r = new FSPluginLoader()
        const result = await r.loadPackageDir(path.join(__dirname, '../../src/plugins'))

        expect(result).to.not.empty()
        expect(result).to.have.key('packages')
        expect(result).to.have.key('failed')

        expect(result.packages).to.be.an('object')
        expect(result.failed).to.be.an(Array)

        delete global.require
    })
})
