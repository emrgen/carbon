export const emailValidator = (email: string) => {
    let error: string | undefined;
    if (!email) {
        error = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
        error = "Invalid email address";
    }
    return error;
}

export const passwordValidator = (password: string) => {
    let error: string | undefined;
    if (!password) {
        error = "Password is required";
    } else if (password.length < 8) {
        error = "Password must be at least 8 characters";
    }
    return error;
}

export const usernameValidator = (username: string) => {
    let error: string | undefined;
    if (!username) {
        error = "Username is required";
    } else if (username.length < 3) {
        error = "Username must be at least 3 characters";
    }
    return error;
}