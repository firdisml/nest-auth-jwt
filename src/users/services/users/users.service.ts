import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/user/user.entity';
import { CreateUserDto } from 'src/users/dto/users.dtos';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  createUser(createUserDto: CreateUserDto) {
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }

  findUsersById(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  findUsers(email: string): Promise<User[]> {
    return this.userRepository.find({
      where: { email },
    });
  }

  async update(id: number, attrs: Partial<User>) {
    const user = await this.findUsersById(id);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    Object.assign(user, attrs);

    return this.userRepository.save(user);
  }
}
