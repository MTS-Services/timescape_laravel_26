<?php

namespace App\Models;

use Illuminate\Contracts\Auth\Authenticatable;

class WhenIWorkUser implements Authenticatable
{
    protected $id;
    protected $email;
    protected $firstName;
    protected $lastName;
    protected $token;
    protected $personData;
    protected $rememberToken;

    public function __construct(array $data = [])
    {
        $this->id = $data['id'] ?? null;
        $this->email = $data['email'] ?? null;
        $this->firstName = $data['firstName'] ?? null;
        $this->lastName = $data['lastName'] ?? null;
        $this->token = $data['token'] ?? null;
        $this->personData = $data['person'] ?? [];
    }

    public function getAuthIdentifierName()
    {
        return 'id';
    }

    public function getAuthIdentifier()
    {
        return $this->id;
    }

    public function getAuthPasswordName()
    {
        return 'password';
    }

    public function getAuthPassword()
    {
        return null;
    }

    public function getRememberToken()
    {
        return $this->rememberToken;
    }

    public function setRememberToken($value)
    {
        $this->rememberToken = $value;
    }

    public function getRememberTokenName()
    {
        return 'remember_token';
    }

    public function getId()
    {
        return $this->id;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function getFirstName()
    {
        return $this->firstName;
    }

    public function getLastName()
    {
        return $this->lastName;
    }

    public function getName()
    {
        return trim($this->firstName . ' ' . $this->lastName);
    }

    public function getToken()
    {
        return $this->token;
    }

    public function getPersonData()
    {
        return $this->personData;
    }

    public function __get($key)
    {
        $method = 'get' . ucfirst($key);
        if (method_exists($this, $method)) {
            return $this->$method();
        }

        return $this->$key ?? null;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'name' => $this->getName(),
            'first_name' => $this->firstName,
            'last_name' => $this->lastName,
        ];
    }

    public function __serialize(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'firstName' => $this->firstName,
            'lastName' => $this->lastName,
            'token' => $this->token,
            'personData' => $this->personData,
        ];
    }

    public function __unserialize(array $data): void
    {
        $this->id = $data['id'] ?? null;
        $this->email = $data['email'] ?? null;
        $this->firstName = $data['firstName'] ?? null;
        $this->lastName = $data['lastName'] ?? null;
        $this->token = $data['token'] ?? null;
        $this->personData = $data['personData'] ?? [];
    }
}
