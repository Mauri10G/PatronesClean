import { BcryptAdapter } from "../../config";
import { UserModel } from "../../data/mongodb";
import { AuthDataSource, CustomError, LoginUserDto, RegisterUserDto, UserEntity } from "../../domain";
import { UserMapper } from "../mappers/user.mapper";

type HashFunction = (password: string) => string;
type CompareFunction = (password: string, hashed: string) => boolean;

export class AuthDataSourceImpl implements AuthDataSource {

    constructor(
        private readonly hashPassword: HashFunction = BcryptAdapter.hash,
        private readonly comparePassword: CompareFunction = BcryptAdapter.compare,
    ) { }



    async login(LoginUserDto: LoginUserDto): Promise<UserEntity> {
        const {email, password} = LoginUserDto;

        try {
            const user = await UserModel.findOne({email});
            if(!user) throw CustomError.badRequest('User does email')
            
            const isMatching = this.comparePassword(password, user.password);
            if(!isMatching) throw CustomError.badRequest('Password no valid')

            return UserMapper.userEntityFromObject(user);


        } catch (error) {
            console.log(error);
            throw CustomError.internalServerError();

        }
    }


    async register(registerUserDto: RegisterUserDto): Promise<UserEntity> {

        const { name, email, password } = registerUserDto;

        try {

            //1. verificar que el correo exista
            const exists = await UserModel.findOne({ email });
            if (exists) throw CustomError.badRequest('User already exists');



            // 2. Hash de la contraseña
            const user = new UserModel({
                name: name,
                email: email,
                password: this.hashPassword(password),
            });

            await user.save();

            //3. Mapear la respuesta a UserEntity
            //TODO: mapear 
            return UserMapper.userEntityFromObject(user);



        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }

            throw CustomError.internalServerError();

        }

    }
}