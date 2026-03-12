import { Router } from "express";
import { AuthController } from "./controller";
import { AuthDataSourceImpl, AuthRepositoryImpl } from "../../infrastructure";
import { AuthMiddleware } from "../middlewares/auth.middlewars";





export class AuthRoutes {



    static get routes(): Router {

        const router = Router();
        const datasource = new AuthDataSourceImpl();
        const authRepository = new AuthRepositoryImpl(datasource);
        const controller = new AuthController(authRepository);


        //Defini todas mis rutas
        router.use('/login',controller.loginUser);
        router.use('/register', controller.registerUser);

        router.get('/', AuthMiddleware.validateJWT ,controller.getUser);


        return router;
    }
}