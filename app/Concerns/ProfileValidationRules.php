<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    protected function profileRules(?int $userId = null): array
    {
        return [
            'nama'      => $this->nameRules(),
            'email'     => $this->emailRules($userId),
            'no_telpon' => $this->phoneRules(),
        ];
    }

    protected function nameRules(): array
    {
        return ['required', 'string', 'max:100'];
    }

    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }

    protected function phoneRules(): array
    {
        return ['nullable', 'string', 'max:15'];
    }
}