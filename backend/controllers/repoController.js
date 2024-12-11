
const createRepo = async (req, res) => {
    const {githubUsername} = req.body;
    console.log('creating repo');
    try{ 

    } catch(error) {
        console.debug(`Error in createRepo function: ${error}`)
        return res.status(500).json({error})
    }
}

module.exports = {
    createRepo
}