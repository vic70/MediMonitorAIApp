export default function handleError(error, req, res, next) {
    error.status = error.status || 500;
    error.message = error.message || "Internal Server Error";


    console.error("Error: ", error);
    res.status(error.status).json({
        success: false,
        message: error.message,
    });
}