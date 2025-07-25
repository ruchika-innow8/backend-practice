const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(err => next(err))
    }
}


export default {asyncHandler};


// const asyncHandler = (fn) => async(req, res, next) =>{
//     try {
//         await
//     } catch (error) {
//         console.error("Error in asyncHandler:", error);
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message || "Internal Server Error"
//         })
//     }
// }
