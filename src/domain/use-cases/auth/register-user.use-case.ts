import { RegisterUserDto } from "../../dtos/auth/register-user.dto";
import { AuthRepository } from "../../repositories/auth.repository";
import { JwtAdapter } from "../../../config";
import { CustomError } from "../..";


interface UserToken{
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

type SignToken = (payload: Object, duration?: string) => Promise<string|null>;


interface RegisterUserUseCase {

    execute(registerUserDto: RegisterUserDto): Promise<any>;
}

export class RegisterUser implements RegisterUserUseCase {

    constructor(
        private readonly authRepository: AuthRepository,
        private readonly signToken: SignToken = JwtAdapter.generateToken,
    ){}


    async execute(registerUserDto: RegisterUserDto): Promise<UserToken> {
        
        const user = await this.authRepository.register(registerUserDto);
        
        
        const token = await this.signToken({ id: user.id }, '2h');

        if(!token) throw CustomError.internalServerError('Error generating token');


        
        return{
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            }
        };
        
        


    }

}

