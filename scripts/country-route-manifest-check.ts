import { assertPublicCountryRouteCoverage } from '../lib/country-data/public-country-dto'

const result = assertPublicCountryRouteCoverage()
console.log(JSON.stringify(result, null, 2))
if (!result.pass) process.exit(1)
