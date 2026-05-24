<?php

use App\Http\Controllers\WhatsappController;
use Illuminate\Support\Facades\Route;

Route::post('/webhook/whatsapp', [WhatsappController::class, 'webhook']);